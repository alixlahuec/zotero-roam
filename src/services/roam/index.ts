/* istanbul ignore file */
import { emitCustomEvent } from "@services/events";
import { triggerSmartblock } from "@services/smartblocks";

import { executeFunctionByName } from "../../utils";
import { formatNotes, formatItemMetadata } from "../../api/helpers";

import { Roam } from "./types";

import { RCitekeyPages, RCitekeyPagesWithEditTime, RCursorLocation, RImportableBlock, RImportableElement, ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "Types/transforms";
import { ArgsMetadataBlocks, OutcomeMetadataStatus, SettingsAnnotations, SettingsMetadata, SettingsNotes, SettingsTypemap } from "Types/extension";


/** Adds Roam blocks to a parent UID based on an Object block template. */
async function addBlockObject(
	/** The UID of the block's parent */
	parentUID: string,
	/** The block object to insert */
	object: RImportableBlock,
	/** The place where the block should be inserted */
	order: Roam.BlockOrder = 0
): Promise<void> {
	const { string: blockString, children = [], ...opts } = object;
	
	if(typeof(blockString) === "undefined"){
		window.zoteroRoam?.error?.({
			origin: "Metadata",
			message: "Bad object received",
			context: {
				object
			}
		});
		throw new Error("All blocks objects must have a `string` property.");
	} else {
		const blockUID = await createRoamBlock(
			opts.parentUID || parentUID,
			blockString,
			// Order parameter from the block itself takes precedence over the arg
			opts.order || order,
			opts);

		// If the Object has a `children` property, process each child element sequentially.
		// Recursion will ensure all nested children are added.
		if (children.constructor === Array) {
			for (const child of children) {
				// eslint-disable-next-line no-await-in-loop
				await addBlock({ parentUID: blockUID, block: child, order: "last" });
			}
		} else {
			window.zoteroRoam?.error?.({
				origin: "Metadata",
				message: "Bad object received",
				context: {
					object
				}
			});
			throw new Error(`If provided, the 'children' property of a block should be an Array - received ${typeof(children)}`);
		}
	}
}


type AddBlockProps = {
	/** The UID of the block's parent */
	parentUID: string,
	/** The block element to insert */
	block: RImportableElement,
	/** The place where the block should be inserted */
	order?: Roam.BlockOrder
};

async function addBlock({ parentUID, block, order = 0 }: AddBlockProps): Promise<void | string> {
	switch (typeof (block)) {
	case "object":
		await addBlockObject(parentUID, block, order);
		break;
	case "string":
		await createRoamBlock(parentUID, block, order);
		break;
	default:
		window.zoteroRoam?.error?.({
			origin: "Metadata",
			message: "Bad element received",
			context: {
				element: block
			}
		});
		throw new Error(`All block items should be of type String or Object - received ${typeof (block)}`);
	}
}

/** Adds Roam blocks to a parent UID, based on an array input.
 * @returns The outcome of the operation
 */
async function addBlocksArray(
	/** The UID of the parent (Roam block or page) */
	parentUID: string,
	/** The array to use as template */
	arr: RImportableElement[]
): Promise<{ args: ArgsMetadataBlocks } & OutcomeMetadataStatus>{
	const defaultOutcome = {
		args: {
			blocks: arr,
			uid: parentUID
		},
		error: null,
		success: null
	};

	if(arr.length > 0){
		try {
			// Go through the array items in reverse order, so that each block gets added to the "same" position
			for (const block of arr.reverse()) {
				// eslint-disable-next-line no-await-in-loop
				await addBlock({ parentUID, block, order: 0 });
			}
			return Promise.resolve({ 
				...defaultOutcome, 
				success: true
			});
		} catch(e) {
			return Promise.resolve({ 
				...defaultOutcome,
				error: e, 
				success: false
			});
		}
	} else {
		window.zoteroRoam?.warn?.({
			origin: "Metadata",
			message: "Empty metadata array received"
		});
		return Promise.resolve(defaultOutcome);
	}
}

/** Adds an entry to Roam's Command Palette
 * @param label - The label for the menu option 
 * @param onSelect - The callback to execute upon selection
 * @param extensionAPI - The API specifically available to the extension
 */
function addPaletteCommand(label: string, onSelect: () => void, extensionAPI: (Roam.ExtensionAPI | Record<string, never>) = {}) {
	const command = {
		label,
		callback: onSelect,
		// TODO: migrate shortcuts to command palette
		"disable-hotkey": true
	};
	if (!extensionAPI.ui) {
		window.roamAlphaAPI.ui.commandPalette.addCommand(command);
	} else {
		extensionAPI.ui.commandPalette.addCommand(command);
	}
}

/** Adds a single Roam block to a parent UID, with optional formatting.
 * @param parentUID - The UID of the parent (Roam block or page)
 * @param string - The text contents of the block
 * @param order - The order of the block on the page
 * @param opts - (optional) Additional formatting to be used (`heading`, `text-align`, ...). See the Roam Alpha API documentation for the complete list of available options.
 * @returns The UID of the created block
 */
async function createRoamBlock(parentUID: string, string: string, order: Roam.BlockOrder = 0, opts: Record<string, any> = {}) {
	const blockUID = window.roamAlphaAPI.util.generateUID();
	const blockContents = {
		"string": string,
		"uid": blockUID
	};
	if(Object.keys(opts).length > 0){
		for(const k of Object.keys(opts)){
			if(["children-view-type", "alignment", "heading"].includes(k)){
				blockContents[k] = opts[k];
			}
		}
	}
	await window.roamAlphaAPI.data.block.create({ location: { "parent-uid": parentUID, order }, "block": blockContents });
	return blockUID;
}

/** Searches for a Roam block by its contents, under a given parent
 * @returns The details of the Roam block (if it exists), otherwise `false`
*/
function findRoamBlock(
	/** The block's contents */
	string: string,
	/** The UID of the targeted parent (Roam block or page) */
	parentUID: string
) {
	const blockSearch = window.roamAlphaAPI.data.q<[[{ uid: string, children?: any[] }]?]>(`[
		:find (pull ?b [:block/uid :block/children])
		:in $ ?string ?parentUID
		:where
			[?par :block/uid ?parentUID]
			[?par :block/children ?b]
			[?b :block/uid ?uid]
			[?b :block/string ?string]
	]`, string, parentUID);

	if(blockSearch[0]){
		return blockSearch[0][0];
	} else {
		return false;
	}
}

/** Searches a Roam page by its title
 * @returns The UID of the Roam page (if it exists), otherwise `false`
 */
function findRoamPage(
	/** The title to be searched */
	title: string
) {
	const pageSearch = window.roamAlphaAPI.data.q<[[string]?]>(`[
		:find ?uid 
		:in $ ?title 
		:where
			[?p :node/title ?title]
			[?p :block/uid ?uid]
		]`, title);
	if(pageSearch[0]){
		return pageSearch[0][0];
	} else{
		return false;
	}
}

/** Retrieves the full list of Roam pages, sorted in alphabetical order
 * @returns The array of all page titles, sorted from A-Z
 */
function getAllPages(){
	return window.roamAlphaAPI.data.q<[string][]>(`[
		:find ?title 
		:where
			[?e :node/title ?title]
		]`)
		.flat(1)
		.sort((a,b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);
}

/** Retrieves the list of citekey pages (i.e, starting with `@`) in the Roam graph
 * @returns A Map whose `keys` are the pages' titles, and whose `entries` are the pages' UIDs
 */
function getCitekeyPages(): RCitekeyPages{
	return new Map(window.roamAlphaAPI.data.q<[string, string][]>(`[
		:find ?title ?uid 
		:where
			[?e :node/title ?title]
			[(clojure.string/starts-with? ?title "@")]
			[?e :block/uid ?uid]
		]`));
}

/** Retrieves the list of citekey pages (i.e, starting with `@`) in the Roam graph, with their last-edit time */
function getCitekeyPagesWithEditTime(): RCitekeyPagesWithEditTime{
	return new Map(window.roamAlphaAPI.data.q<{ title: string, time: number, uid: string, _parents: { time: number }[] }[]>(`[
		:find [(pull ?e [:node/title :edit/time :block/uid {:block/_parents [:edit/time]}])...] 
		:where
			[?e :node/title ?t]
			[(clojure.string/starts-with? ?t "@")]
		]`)
		.filter(p => p.time)
		.map(p => {
			const { title, uid } = p;
			const latest_edit = p._parents ? Math.max(...p._parents.map(c => c.time)) : p.time;
			return [title, { edited: new Date(Math.max(latest_edit, p.time)), uid }];
		}));
}

/** Retrieves the current cursor location in the Roam interface, to enable returning focus to its previous state after an interaction with the extension's interface (e.g opening a dialog). */
function getCurrentCursorLocation() {
	const { "block-uid": blockUID, "window-id": windowID } = (window.roamAlphaAPI.ui.getFocusedBlock() || {});
	if(!blockUID || !windowID){ return null; }

	const blockElementID = ["block-input", windowID, blockUID].join("-");
	const blockElement = document.getElementById(blockElementID)!;
	const { selectionStart = null, selectionEnd = null } = (blockElement || {}) as Record<string,any>;

	const output: RCursorLocation = {
		id: blockElementID,
		location: {
			"block-uid": blockUID,
			"window-id": windowID
		}
	};

	if(selectionStart && selectionEnd){
		output.selection = {
			start: selectionStart,
			end: selectionEnd
		};
	}

	return output;
}

/** Retrieve the name of the current Roam graph. */
function getGraphName(){
	return window.roamAlphaAPI.graph.name;
}

/** Retrieves the full list of Roam pages whose title begins with any of the keys provided 
 * @returns The Array of pages whose title begins with any of the specified initials
 */
function getInitialedPages(
	/** The Array of keys for which to retrieve Roam pages */
	keys: string[]
) {
	return window.roamAlphaAPI.data.q<{ title: string, uid: string }[][]>(`[
		:find (pull ?e [:node/title :block/uid]) 
		:in $ [?k ...] 
		:where
			[?e :node/title ?title]
			[(clojure.string/starts-with? ?title ?k)]
		]`, keys)
		.flat(1);
}

/** Imports an item's metadata as Roam blocks
 * @fires zotero-roam:metadata-added
 * @returns If successful, a detailed outcome of the import ; otherwise, the first error encountered.
 */
async function importItemMetadata(
	/** The item's Zotero data and its children, if any */
	{ item, pdfs = [], notes = [] }: { item: ZItemTop, pdfs?: ZItemAttachment[], notes?: (ZItemNote | ZItemAnnotation)[] },
	/** The UID of the item's Roam page (if it exists), otherwise `false` */
	uid: string | false,
	metadataSettings: SettingsMetadata,
	typemap: SettingsTypemap,
	notesSettings: SettingsNotes,
	annotationsSettings: SettingsAnnotations
) {
	const title = "@" + item.key;
	const pageUID = uid || window.roamAlphaAPI.util.generateUID();
	const page = { new: false, title, uid: pageUID };
	
	if(pageUID != uid){
		window.roamAlphaAPI.data.page.create({ page: { title, "uid": pageUID } });
		page.new = true;
	}
	
	const { use = "default", func = "", smartblock: { param, paramValue } } = metadataSettings;

	try {
		let event;

		if (use == "smartblock") {
			const importOutcome = await triggerSmartblock(page.uid, { param, paramValue }, { item, notes, page, pdfs });
			event = { page, ...importOutcome };
		} else {
			const blocks = (use == "function" && func)
				? await executeFunctionByName(func, window, item, pdfs, notes)
				: formatItemMetadata(item, pdfs, notes, { annotationsSettings, notesSettings, typemap });
			const importOutcome = await addBlocksArray(pageUID, blocks);
			event = { page, raw: { item, pdfs, notes }, ...importOutcome };
		}

		emitCustomEvent({ ...event, _type: "metadata-added" })			
		return event;
	} catch (e) {
		window.zoteroRoam?.error?.({
			origin: "Metadata",
			message: "Failed to import metadata for: " + title,
			detail: e.message,
			context: {
				page,
				settings: {
					annotations: annotationsSettings,
					metadata: metadataSettings,
					notes: notesSettings
				}
			},
			showToaster: 1000
		});
		return await Promise.reject(e);
	}
}

/** Imports an item's notes as Roam blocks
 * @fires zotero-roam:notes-added
 * @returns If successful, a detailed outcome of the immport ; otherwise, the first error encountered.
 */
async function importItemNotes(
	/** The item's Zotero data and its notes, if any */
	{ item, notes = [] }: { item: ZItemTop, notes?: (ZItemNote | ZItemAnnotation)[] },
	/** The UID of the item's Roam page (if it exists), otherwise `false` */
	uid: string | false,
	notesSettings: SettingsNotes,
	annotationsSettings: SettingsAnnotations
) {
	const title = "@" + item.key;
	const pageUID = uid || window.roamAlphaAPI.util.generateUID();
	const page = { new: false, title, uid: pageUID };

	if(pageUID != uid){
		window.roamAlphaAPI.data.page.create({ page: { title, "uid": pageUID } });
		page.new = true;
	}

	try {
		const formattedOutput = formatNotes(notes, pageUID, { annotationsSettings, notesSettings });
		const importOutcome = await addBlocksArray(pageUID, formattedOutput);

		const outcome = {
			page,
			raw: {
				item,
				notes
			},
			...importOutcome
		};
		emitCustomEvent({ ...outcome, _type: "notes-added" });
		
		return outcome;

	} catch(e) {
		window.zoteroRoam?.error?.({
			origin: "Notes",
			message: "Failed to import notes for: " + title,
			detail: e.message,
			context: {
				page,
				settings: {
					annotations: annotationsSettings,
					notes: notesSettings
				}
			},
			showToaster: 1000
		});
		return await Promise.reject(e);
	}
}


/** Converts input into a Roam DNP title */
function makeDNP(date: Date | any, { brackets = true }: { brackets?: boolean } = {}) {
	const thisdate = date.constructor === Date ? date : new Date(date);
	const dnp_title = window.roamAlphaAPI.util.dateToPageTitle(thisdate);

	if (brackets) {
		return `[[${dnp_title}]]`;
	} else {
		return dnp_title;
	}
}


/** Places the cursor in a given location, if it is specified */
function maybeReturnCursorToPlace(place: RCursorLocation | null){
	if(place && place.location){
		const { id, ...rest } = place;
		const blockStillExists = document.getElementById(id) || false;
		if(blockStillExists){
			window.roamAlphaAPI.ui.setBlockFocusAndSelection(rest);
		}
	}
}

/** Opens a Roam block or page in the right sidebar, based on its UID. */
async function openInSidebarByUID(
	/** The UID of the Roam entity (block or page) */
	uid: string,
	/** The type of window that should be added to the sidebar. */
	type: Roam.SidebarWindowType = "outline"
) {
	await window.roamAlphaAPI.ui.rightSidebar.addWindow({ window: { type, "block-uid": uid } });
}

/** Navigates to a Roam page, based on its UID. */
async function openPageByUID(uid: string){
	await window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid } });
}

/** Converts a Roam DNP title into a Date
 * @returns The corresponding date, either as a Date or an Array [YYYY,M,D]. In the array format, the month is zero-indexed.
 */
function readDNP(string: string, { as_date = true }: { as_date?: boolean } = {}) {
	const parsedDate = window.roamAlphaAPI.util.pageTitleToDate(string);
	return as_date ? parsedDate : [parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()];
}

/** Removes an entry from Roam's Command Palette */
function removePaletteCommand(label: string, extensionAPI: Roam.ExtensionAPI | Record<string, never> = {}) {
	const command = { label };
	if (!extensionAPI.ui) {
		window.roamAlphaAPI.ui.commandPalette.removeCommand(command);	
	} else {
		extensionAPI.ui.commandPalette.removeCommand(command);
	}
}

export * from "./types";

export {
	addPaletteCommand,
	findRoamBlock,
	findRoamPage,
	getAllPages,
	getCitekeyPages,
	getCitekeyPagesWithEditTime,
	getCurrentCursorLocation,
	getGraphName,
	getInitialedPages,
	importItemMetadata,
	importItemNotes,
	makeDNP,
	maybeReturnCursorToPlace,
	openInSidebarByUID,
	openPageByUID,
	readDNP,
	removePaletteCommand
};
