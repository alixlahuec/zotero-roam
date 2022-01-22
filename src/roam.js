import { emitCustomEvent } from "./events";
import { getItemMetadata } from "./formatting";
import { use_smartblock_metadata } from "./smartblocks";
import { executeFunctionByName } from "./utils";

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

function addPaletteCommand(label, callback){
	window.roamAlphaAPI.ui.commandPalette.addCommand({
		label,
		callback
	});
}

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
	await window.roamAlphaAPI.createBlock({ "location": { "parent-uid": parentUID, "order": order }, "block": blockContents });
	return blockUID;
}

function findRoamPage(title){
	let pageSearch = window.roamAlphaAPI.q("[:find ?uid :in $ ?title :where[?p :node/title ?title][?p :block/uid ?uid]]", title);
	if(pageSearch.length > 0){
		return pageSearch[0][0];
	} else{
		return false;
	}
}

function getCitekeyPages(){
	return new Map(window.roamAlphaAPI.q("[:find ?title ?uid :where[?e :node/title ?title][(clojure.string/starts-with? ?title \"@\")][?e :block/uid ?uid]]"));
}

// TODO: Setup error handling, clean return logic, add visual feedback (Toast)
async function importItemMetadata({item, pdfs = [], notes = []} = {}, uid, config){
	let title = "@" + item.key;
	let pageUID = uid || window.roamAlphaAPI.util.generateUID();
	let page = {title: title, uid: pageUID};
	
	if(pageUID != uid){
		window.roamAlphaAPI.createPage({"page": {"title": title, "uid": pageUID}});
		page.new = true;
	} else {
		page.new = false;
	}
	
	let { use, func = null, smartblock = {}} = config;

	if(use == "smartblock"){
		// TODO: Handle case where smartblock is {} ; add support  for passing children (PDFs/notes) to SmartBlock
		let context = { item, page, uid: pageUID };
		try {
			return await use_smartblock_metadata(smartblock, context);
		} catch(e) {
			console.log({config: smartblock, context });
			return await Promise.reject(e);
		}
	} else {
		try {
			let metadata = func ? await executeFunctionByName(func, window, item, pdfs, notes) : getItemMetadata(item, pdfs, notes);
			let { args, error, success } = await addBlocksArray(pageUID, metadata);

			emitCustomEvent("metadata-added", {
				args,
				error,
				raw: {
					item,
					pdfs,
					notes
				},
				success,
				title
			});
		} catch(e) {
			return await Promise.reject(e);
		}
	}
}

function openInSidebarByUID(uid, type = "outline"){
	window.roamAlphaAPI.ui.rightSidebar.addWindow({window:{"type": type, "block-uid": uid}});
}

function openPageByUID(uid){
	window.roamAlphaAPI.ui.mainWindow.openPage({page: {uid: uid}});
}

export {
	addBlocksArray,
	addPaletteCommand,
	findRoamPage,
	getCitekeyPages,
	importItemMetadata,
	openInSidebarByUID,
	openPageByUID
};