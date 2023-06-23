/* istanbul ignore file */

import { jest } from "@storybook/jest";


export const uid_with_existing_block = "__UID_WITH_EXISTING_BLOCK__";
export const uid_with_existing_block_with_children = "__UID_WITH_EXISTING_BLOCK_WITH_CHILDREN__";
export const existing_block_uid = "__SOME_UID__";
export const existing_block_uid_with_children = "__SOME_UID_WITH_CHILDREN__";

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

function getCitekeyPagesWithEditTime(){
	return new Map([]);
}

function getInitialedPages(keys) {
	if (keys.includes("h")) {
		return [
			{ title: "housing", uid: "__some_uid__" }
		];
	}

	return [];
}

const importItemNotes = jest.fn(() => {});

export {
	findRoamBlock,
	findRoamPage,
	getAllPages,
	getCitekeyPagesWithEditTime,
	getInitialedPages,
	importItemNotes
};