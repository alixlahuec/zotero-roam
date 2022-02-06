import { emitCustomEvent } from "./events";
import { getItemMetadata } from "./formatters/getItemMetadata";
import { use_smartblock_metadata } from "./smartblocks";
import { executeFunctionByName, formatNotes } from "./utils";

/** Adds Roam blocks to a parent UID based on an Object block template.
 * @param {String} parentUID - The UID of the parent (Roam block or page) 
 * @param {{string: String, children?: Array}} object - The block Object to use as template 
 */
async function addBlockObject(parentUID, object) {
	let {string: blockString, children = [], ...opts} = object;
	
	if(typeof(blockString) === "undefined"){
		console.log(object);
		throw new Error("All blocks passed as an Object must have a string property.");
	} else {
		let blockUID = await createRoamBlock(parentUID, blockString, 0, opts);
		// If the Object has a `children` property
		if(children.constructor === Array){
			// Go through each child element, starting by the last
			// Recursion will ensure all nested children will be added
			for(let j = children.length - 1; j >= 0; j--){
				if(children[j].constructor === Object){
					await addBlockObject(blockUID, children[j]);
				} else if(children[j].constructor === String){
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
 * @param {Array<String|{string: String, children?: Array}>} arr - The array to use as template
 * @returns The outcome of the operation
 */
async function addBlocksArray(parentUID, arr){
	let defaultOutcome = {
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
					await addBlockObject(parentUID, arr[k]);
				} else if(arr[k].constructor === String) {
					// If the element is a simple String, add the corresponding block & move on
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
	let blockUID = window.roamAlphaAPI.util.generateUID();
	let blockContents = {
		"string": string,
		"uid": blockUID
	};
	if(Object.keys(opts).length > 0){
		for(let k of Object.keys(opts)){
			if(["children-view-type", "alignment", "heading"].includes(k)){
				blockContents[k] = opts[k];
			}
		}
	}
	await window.roamAlphaAPI.createBlock({ location: { "parent-uid": parentUID, order }, "block": blockContents });
	return blockUID;
}

/** Searches a Roam page by its title
 * @param {String} title - The title to be searched
 * @returns {String|false} The UID of the Roam page (if it exists), otherwise `false`
 */
function findRoamPage(title){
	let pageSearch = window.roamAlphaAPI.q(`[
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
 * @param {{item: ZoteroItem, pdfs: ZoteroItem[], notes: ZoteroItem[]}} itemData - The item's Zotero data and its children, if any
 * @param {String|Boolean} uid - The UID of the item's Roam page (if it exists), otherwise a falsy value 
 * @param {Object} config - The user's `metadata` settings 
 * @returns IF successful, a detailed outcome of the import ; otherwise, the first error encountered.
 */
async function importItemMetadata({item, pdfs = [], notes = []} = {}, uid, config){
	let title = "@" + item.key;
	let pageUID = uid || window.roamAlphaAPI.util.generateUID();
	let page = { new: null, title, uid: pageUID };
	
	if(pageUID != uid){
		window.roamAlphaAPI.createPage({ page: { title, "uid": pageUID}});
		page.new = true;
	} else {
		page.new = false;
	}
	
	let { use, func = null, smartblock = {}} = config;

	// TODO: Add support or options for passing formatted children (PDFs/notes), for both `use` parameters
	if(use == "smartblock"){
		let context = { item, notes, page, pdfs };
		try {
			let outcome = await use_smartblock_metadata(smartblock, context);
			emitCustomEvent("metadata-added", outcome);

			return outcome;

		} catch(e) {
			return await Promise.reject(e);
		}
	} else {
		try {
			let metadata = func ? await executeFunctionByName(func, window, item, pdfs, notes) : getItemMetadata(item, pdfs, notes);
			let { args, error, success } = await addBlocksArray(pageUID, metadata);

			let outcome = {
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
 * @param {{item: ZoteroItem, notes: ZoteroItem[]}} itemData - The item's Zotero data and its notes, if any 
 * @param {String|Boolean} uid - The UID of the item's Roam page (if it exists), otherwise a falsy value
 * @param {Object} config - The user's `notes` settings
 * @returns If successful, a detailed outcome of the immport ; otherwise, the first error encountered.
 */
async function importItemNotes({item, notes = []} = {}, uid, config){
	let title = "@" + item.key;
	let pageUID = uid || window.roamAlphaAPI.util.generateUID();
	let page = { new: null, title, uid: pageUID };

	if(pageUID != uid){
		window.roamAlphaAPI.createPage({ page: { title, "uid": pageUID}});
		page.new = true;
	} else {
		page.new = false;
	}

	try {
		let formattedNotes = formatNotes(notes, config);
		let { args, error, success } = await addBlocksArray(pageUID, formattedNotes);

		let outcome = {
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

/** Opens a Roam block or page in the right sidebar, based on its UID.
 * @param {String} uid - The UID of the Roam entity (block or page)
 * @param {String} type - The type of window that should be added to the sidebar. See the Roam Alpha API documentation for the complete list of available options.
 * @see https://roamresearch.com/#/app/developer-documentation/page/yHDobV8KV
 */
async function openInSidebarByUID(uid, type = "outline"){
	await window.roamAlphaAPI.ui.rightSidebar.addWindow({ window: { type, "block-uid": uid}});
}

/** Navigates to a Roam page, based on its UID.
 * @param {String} uid - The UID of the Roam page 
 * @see https://roamresearch.com/#/app/developer-documentation/page/_VyuLpfWb
 */
async function openPageByUID(uid){
	await window.roamAlphaAPI.ui.mainWindow.openPage({ page: { uid }});
}

export {
	addBlocksArray,
	addPaletteCommand,
	findRoamPage,
	getAllPages,
	getCitekeyPages,
	getInitialedPages,
	importItemMetadata,
	importItemNotes,
	openInSidebarByUID,
	openPageByUID
};