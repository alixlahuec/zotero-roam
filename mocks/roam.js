/* istanbul ignore file */

export const uid_with_existing_block = "__UID_WITH_EXISTING_BLOCK__";
export const existing_block_uid = "__SOME_UID__";

function findRoamBlock(_string, pageUID){
	return (pageUID == uid_with_existing_block)
		? existing_block_uid
		: false;
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

function getInitialedPages(_keys){
	return [];
}

export {
	findRoamBlock,
	findRoamPage,
	getAllPages,
	getCitekeyPagesWithEditTime,
	getInitialedPages
};