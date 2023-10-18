import { jest } from "@storybook/jest";


export const uid_with_existing_block = "__UID_WITH_EXISTING_BLOCK__";
export const uid_with_existing_block_with_children = "__UID_WITH_EXISTING_BLOCK_WITH_CHILDREN__";
export const existing_block_uid = "__SOME_UID__";
export const existing_block_uid_with_children = "__SOME_UID_WITH_CHILDREN__";

function addPaletteCommand(){}

function findRoamBlock(_string, pageUID){
	switch(pageUID){
	case uid_with_existing_block:
		return {
			uid: existing_block_uid
		};
	case uid_with_existing_block_with_children:
		return {
			uid: existing_block_uid_with_children,
			children: [{ id: 123 }, { id: 456 }]
		};
	default:
		return false;
	}
}

function findRoamPage(_title){
	return false;
}

function getAllPages(){
	return [];
}

function getCitekeyPages() {
	return new Map([]);
}

function getCitekeyPagesWithEditTime(){
	return new Map([]);
}

function getCurrentCursorLocation() {
	return null;
}

function getGraphName() {
	return "mock-graph";
}

function getInitialedPages(keys) {
	if (keys.includes("h")) {
		return [
			{ title: "housing", uid: "__some_uid__" }
		];
	}

	return [];
}

function importItemMetadata() {
	return {};
}

const importItemNotes = jest.fn(() => {});

function maybeReturnCursorToPlace(){}

async function openInSidebarByUID(){}

async function openPageByUID(){}

function removePaletteCommand(){}

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
	maybeReturnCursorToPlace,
	openInSidebarByUID,
	openPageByUID,
	removePaletteCommand
};