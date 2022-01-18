async function addBlockObject(parentUID, object) {
	let {string: blockString, children: blockChildren, ...opts} = object;
	// If the Object doesn't have a string property, throw an error
	if(typeof(blockString) === "undefined"){
		console.log(object);
		throw new Error("All blocks passed as an Object must have a string property");
	} else {
		// Otherwise add the block
		let blockUID = await createRoamBlock(parentUID, blockString, 0, opts);
		// If the Object has a `children` property
		if(typeof(blockChildren) !== "undefined"){
			// Go through each child element, starting by the last
			// Recursion will ensure all nested children will be added
			for(let j = blockChildren.length - 1; j >= 0; j--){
				if(blockChildren[j].constructor === Object){
					await addBlockObject(blockUID, blockChildren[j]);
				} else if(blockChildren[j].constructor === String){
					await createRoamBlock(blockUID, blockChildren[j], 0, {});
				} else {
					throw new Error("All children array items should be of type String or Object");
				}
			}
		}
	}
}

async function addBlocksArray(parentUID, arr){
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
					throw new Error("All array items should be of type String or Object");
				}
			}
			Promise.resolve({ success: true });
		} catch(e) {
			console.error(e);
			Promise.reject({ success: false });
		}
	} else {
		Promise.resolve({ success: null });
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
	openInSidebarByUID,
	openPageByUID
};