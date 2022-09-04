import { Classes } from "@blueprintjs/core";


const dialogClass="search-library";
const dialogLabel="zr-library-search-dialogtitle";
const resultClass = [Classes.TEXT_OVERFLOW_ELLIPSIS, "zr-library-item--contents"].join(" ");
const resultKeyClass = [Classes.MENU_ITEM_LABEL, "zr-library-item--key"].join(" ");

export {
	dialogClass,
	dialogLabel,
	resultClass,
	resultKeyClass
};
