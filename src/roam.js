/* istanbul ignore file */
import { executeFunctionByName } from "./utils";
import { _formatNotes, _getItemMetadata } from "./extension";
import { emitCustomEvent } from "./events";
import { use_smartblock_metadata } from "./smartblocks";

/** Adds Roam blocks to a parent UID based on an Object block template.
 * @param {String} parentUID - The UID of the parent (Roam block or page) 
 * @param {RoamImportableBlock} object - The block Object to use as template 
 */
async function addBlockObject(parentUID, object) {
	const { string: blockString, children = [], ...opts } = object;
	
	if(typeof(blockString) === "undefined"){
		console.log(object);
		throw new Error("All blocks passed as an Object must have a string property.");
	} else {
		const blockUID = await createRoamBlock(opts.parentUID || parentUID, blockString, 0, opts);
		// If the Object has a `children` property
		if(children.constructor === Array){
			// Go through each child element, starting by the last
			// Recursion will ensure all nested children will be added
			for(let j = children.length - 1; j >= 0; j--){
				if(children[j].constructor === Object){
					// eslint-disable-next-line no-await-in-loop
					await addBlockObject(blockUID, children[j]);
				} else if(children[j].constructor === String){
					// eslint-disable-next-line no-await-in-loop
					await createRoamBlock(blockUID, children[j], 0, {});
				} else {
					console.log(children[j]);
					throw new Error(`All children array items should be of type String or Object, not ${children[j].constructor}`);
				}
			}
		} else {
			console.log(object);
			throw new Error(`If provided, the 'children' property of a block should be an Array, not ${children.constructor}`);
		}
	}
}

/** Adds Roam blocks to a parent UID, based on an array input.
 * @param {String} parentUID - The UID of the parent (Roam block or page) 
 * @param {(String|RoamImportableBlock)[]} arr - The array to use as template
 * @returns The outcome of the operation
 */
async function addBlocksArray(parentUID, arr){
	const defaultOutcome = {
		args: {
			blocks: arr,
			uid: parentUID
		},
		error: null,
		success: null
	};

	if(arr.length > 0){
		try{
			// Go through the array items in reverse order, because each block gets added to the top so have to start with the 'last' block
			for(let k = arr.length - 1; k >= 0; k--){
				// If the element is an Object, pass it to addBlockObject to recursively process its contents
				if(arr[k].constructor === Object){
					// eslint-disable-next-line no-await-in-loop
					await addBlockObject(parentUID, arr[k]);
				} else if(arr[k].constructor === String) {
					// If the element is a simple String, add the corresponding block & move on
					// eslint-disable-next-line no-await-in-loop
					await createRoamBlock(parentUID, arr[k], 0, {});
				} else {
					console.log(arr[k]);
					throw new Error(`All array items should be of type String or Object, not ${arr[k].constructor}`);
				}
			}
			return Promise.resolve({ 
				...defaultOutcome, 
				success: true });
		} catch(e) {
			console.error(e);
			return Promise.resolve({ 
				...defaultOutcome,
				error: e, 
				success: false });
		}
	} else {
		console.warn("The metadata array received was empty. Depending on your configuration, this may or may not be expected.");
		return Promise.resolve(defaultOutcome);
	}
}

/** Adds an entry to Roam's Command Palette
 * @param {String} label - The label for the menu option 
 * @param {Function} onSelect - The callback to execute upon selection
 * @see https://roamresearch.com/#/app/developer-documentation/page/rAkidgrv3
 */
function addPaletteCommand(label, onSelect){
	window.roamAlphaAPI.ui.commandPalette.addCommand({
		label,
		callback: onSelect
	});
}

/** Adds a single Roam block to a parent UID, with optional formatting.
 * @param {String} parentUID - The UID of the parent (Roam block or page)
 * @param {String} string - The text contents of the block
 * @param {Number} order - The order of the block on the page
 * @param {Object} opts - (optional) Additional formatting to be used (`heading`, `text-align`, ...). See the Roam Alpha API documentation for the complete list of available options.
 * @returns The UID of the created block
 * @see https://roamresearch.com/#/app/developer-documentation/page/Sq5IhwNQY
 */
async function createRoamBlock(parentUID, string, order = 0, opts = {}) {
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
	await window.roamAlphaAPI.createBlock({ location: { "parent-uid": parentUID, order }, "block": blockContents });
	return blockUID;
}

/** Searches for a Roam block by its contents, under a given parent
 * @param {String} string - The block's contents
 * @param {String} parentUID - The UID of the targeted parent (Roam block or page)
 * @returns {String|false} The UID of the Roam block (if it exists), otherwise `false`
*/
function findRoamBlock(string, parentUID){
	const blockSearch = window.roamAlphaAPI.q(`[
		:find ?uid
		:in $ ?string ?parentUID
		:where
			[?par :block/uid ?parentUID]
			[?par :block/children ?b]
			[?b :block/uid ?uid]
			[?b :block/string ?string]
	]`, string, parentUID);

	if(blockSearch.length > 0){
		return blockSearch[0][0];
	} else {
		return false;
	}
}

/** Searches a Roam page by its title
 * @param {String} title - The title to be searched
 * @returns {String|false} The UID of the Roam page (if it exists), otherwise `false`
 */
function findRoamPage(title){
	const pageSearch = window.roamAlphaAPI.q(`[
		:find ?uid 
		:in $ ?title 
		:where
			[?p :node/title ?title]
			[?p :block/uid ?uid]
		]`, title);
	if(pageSearch.length > 0){
		return pageSearch[0][0];
	} else{
		return false;
	}
}

/** Retrieves the full list of Roam pages, sorted in alphabetical order
 * @returns {String[]} The array of all page titles, sorted from A-Z
 */
function getAllPages(){
	return window.roamAlphaAPI.q(`[
		:find ?title 
		:where
			[?e :node/title ?title]
		]`)
		.flat(1)
		.sort((a,b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);
}

/** Retrieves the list of citekey pages (i.e, starting with `@`) in the Roam graph
 * @returns {Map<String,String>} A Map whose `keys` are the pages' titles, and whose `entries` are the pages' UIDs
 */
function getCitekeyPages(){
	return new Map(window.roamAlphaAPI.q(`[
		:find ?title ?uid 
		:where
			[?e :node/title ?title]
			[(clojure.string/starts-with? ?title "@")]
			[?e :block/uid ?uid]
		]`));
}

/** Retrieves the list of citekey pages (i.e, starting with `@`) in the Roam graph, with their last-edit time
 * @returns {Map<String, {edited: Date, uid: String}>} A Map whose `keys` are the pages' titles, and whose `entries` contain the pages' UIDs and last-edit times
 */
function getCitekeyPagesWithEditTime(){
	return new Map(window.roamAlphaAPI.q(`[
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

/**
 * @typedef {{
 * id: String,
 * location: {"block-uid": String, "window-id": String},
 * selection: ({start: Integer, end: Integer}|undefined)
 * }}
 * CursorLocation
 */
/** Retrieves the current cursor location in the Roam interface, to enable returning focus to its previous state after an interaction with the extension's interface (e.g opening a dialog).
 * @returns {CursorLocation} Information about the cursor's location
 */
function getCurrentCursorLocation(){
	const { "block-uid": blockUID, "window-id": windowID } = (window.roamAlphaAPI.ui.getFocusedBlock() || {});
	if(!blockUID || !windowID){ return null; }

	const blockElementID = ["block-input", windowID, blockUID].join("-");
	const blockElement = document.getElementById(blockElementID) || {};
	const { selectionStart = null, selectionEnd = null } = blockElement;

	const output = {
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

/** Retrieves the full list of Roam pages whose title begins with any of the keys provided
 * @param {String[]} keys - The Array of keys for which to retrieve Roam pages 
 * @returns {{title: String, uid: String}[]} The Array of pages whose title begins with any of the specified initials
 */
function getInitialedPages(keys){
	return window.roamAlphaAPI.q(`[
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
 * @param {{item: ZoteroItem, pdfs: ZoteroItem[], notes: (ZoteroItem|ZoteroAnnotation)[]}} itemData - The item's Zotero data and its children, if any
 * @param {String|Boolean} uid - The UID of the item's Roam page (if it exists), otherwise a falsy value 
 * @param {SettingsMetadata} metadataSettings - The user's `metadata` settings 
 * @param {SettingsTypemap} typemap - The user's `typemap` settings
 * @param {SettingsNotes} notesSettings - The user's `notes` settings
 * @param {SettingsAnnotations} annotationsSettings - The user's `annotations` settings
 * @returns If successful, a detailed outcome of the import ; otherwise, the first error encountered.
 */
async function importItemMetadata({ item, pdfs = [], notes = [] } = {}, uid, metadataSettings, typemap, notesSettings, annotationsSettings){
	const title = "@" + item.key;
	const pageUID = uid || window.roamAlphaAPI.util.generateUID();
	const page = { new: null, title, uid: pageUID };
	
	if(pageUID != uid){
		window.roamAlphaAPI.createPage({ page: { title, "uid": pageUID } });
		page.new = true;
	} else {
		page.new = false;
	}
	
	const { use = "default", func = "", smartblock: { param, paramValue } } = metadataSettings;

	if(use == "smartblock"){
		const context = { item, notes, page, pdfs };
		try {
			const outcome = await use_smartblock_metadata({ param, paramValue }, context);
			emitCustomEvent("metadata-added", outcome);

			return outcome;

		} catch(e) {
			return await Promise.reject(e);
		}
	} else {
		try {
			const metadata = (use == "function" && func) 
				? await executeFunctionByName(func, window, item, pdfs, notes) 
				: _getItemMetadata(item, pdfs, notes, { annotationsSettings, notesSettings, typemap });
			const { args, error, success } = await addBlocksArray(pageUID, metadata);

			const outcome = {
				args,
				error,
				page,
				raw: {
					item,
					pdfs,
					notes
				},
				success
			};
			emitCustomEvent("metadata-added", outcome);
			
			return outcome;

		} catch(e) {
			return await Promise.reject(e);
		}
	}
}

/** Imports an item's notes as Roam blocks
 * @fires zotero-roam:notes-added
 * @param {{item: ZoteroItem, notes: (ZoteroItem|ZoteroAnnotation)[]}} itemData - The item's Zotero data and its notes, if any 
 * @param {String|Boolean} uid - The UID of the item's Roam page (if it exists), otherwise a falsy value
 * @param {SettingsNotes} notesSettings - The user's `notes` settings
 * @param {SettingsAnnotations} annotationsSettings - The user's `annotations` settings
 * @returns If successful, a detailed outcome of the immport ; otherwise, the first error encountered.
 */
async function importItemNotes({ item, notes = [] } = {}, uid, notesSettings, annotationsSettings){
	const title = "@" + item.key;
	const pageUID = uid || window.roamAlphaAPI.util.generateUID();
	const page = { new: null, title, uid: pageUID };

	if(pageUID != uid){
		window.roamAlphaAPI.createPage({ page: { title, "uid": pageUID } });
		page.new = true;
	} else {
		page.new = false;
	}

	try {
		const formattedOutput = _formatNotes(notes, { annotationsSettings, notesSettings });
		const { args, error, success } = await addBlocksArray(pageUID, formattedOutput);

		const outcome = {
			args,
			error,
			page,
			raw: {
				item,
				notes
			},
			success
		};
		emitCustomEvent("notes-added", outcome);
		
		return outcome;

	} catch(e) {
		return await Promise.reject(e);
	}
}

/** Places the cursor in a given location, if it is specified
 * @param {CursorLocation} place 
 */
function maybeReturnCursorToPlace(place = {}){
	if(place && place.location){
		const { id, ...rest } = place;
		const blockStillExists = document.getElementById(id) || false;
		if(blockStillExists){
			window.roamAlphaAPI.ui.setBlockFocusAndSelection(rest);
		}
	}
}

/** Opens a Roam block or page in the right sidebar, based on its UID.
 * @param {String} uid - The UID of the Roam entity (block or page)
 * @param {String} type - The type of window that should be added to the sidebar. See the Roam Alpha API documentation for the complete list of available options.
 * @see https://roamresearch.com/#/app/developer-documentation/page/yHDobV8KV
 */
async function openInSidebarByUID(uid, type = "outline"){
	await window.roamAlphaAPI.ui.rightSidebar.addWindow({ window: { type, "block-uid": uid } });
}

/** Navigates to a Roam page, based on its UID.
 * @param {String} uid - The UID of the Roam page 
 * @see https://roamresearch.com/#/app/developer-documentation/page/_VyuLpfWb
 */
async function openPageByUID(uid){
	await window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid } });
}

/** Removes an entry from Roam's Command Palette
 * @param {String} label - The label for the menu option
 * @see https://roamresearch.com/#/app/developer-documentation/page/eG9ulEdWq
 */
function removePaletteCommand(label){
	window.roamAlphaAPI.ui.commandPalette.removeCommand({ label });
}

export {
	addBlocksArray,
	addPaletteCommand,
	findRoamBlock,
	findRoamPage,
	getAllPages,
	getCitekeyPages,
	getCitekeyPagesWithEditTime,
	getCurrentCursorLocation,
	getInitialedPages,
	importItemMetadata,
	importItemNotes,
	maybeReturnCursorToPlace,
	openInSidebarByUID,
	openPageByUID,
	removePaletteCommand
};
