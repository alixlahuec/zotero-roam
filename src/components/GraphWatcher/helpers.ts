import { identifyChildren, makeTimestamp } from "../../utils";
import { RCitekeyPages, ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "Types/transforms";


/**
 * @see cleanRelatedItemType
 */
type CleanRelatedItem = {
	abstract: string,
	added: string,
	children: {
		notes: (ZItemAnnotation | ZItemNote)[],
		pdfs: ZItemAttachment[]
	},
	inGraph: string | false,
	itemType: ZItemTop["data"]["itemType"],
	key: string,
	location: string,
	meta: string,
	raw: ZItemTop,
	timestamp: string,
	title: string
};

/** Formats an item for display in AuxiliaryDialog
 * @param item - The item to format
 * @param libraryData - The list of attachments in the library
 * @param roamCitekeys - The map of citekey pages in the Roam graph. Each entry contains the page's UID.  
 * @returns The formatted item
 * @see cleanRelatedItemType
 */
function cleanRelatedItem(
	item: ZItemTop,
	{ pdfs = [], notes = [] }: { pdfs: ZItemAttachment[], notes: (ZItemAnnotation|ZItemNote)[] },
	roamCitekeys: RCitekeyPages
): CleanRelatedItem {
	const creator = item.meta.creatorSummary || "";
	const pub_year = item.meta.parsedDate ? `(${new Date(item.meta.parsedDate).getUTCFullYear()})` : "";
	const itemKey = item.data.key;
	const location = item.library.type + "s/" + item.library.id;

	const children = identifyChildren(itemKey, location, { pdfs: pdfs, notes: notes });

	return {
		abstract: item.data.abstractNote || "",
		added: item.data.dateAdded,
		children,
		inGraph: roamCitekeys.get("@" + item.key) || false,
		itemType: item.data.itemType,
		key: item.key,
		location,
		meta: [creator, pub_year].filter(Boolean).join(" "),
		raw: item,
		timestamp: makeTimestamp(item.data.dateAdded),
		title: item.data.title || ""
	};
}

/** Checks if the contents of a NodeList have changed
 * @see https://stackoverflow.com/questions/51958759/how-can-i-test-the-equality-of-two-nodelists
 * @returns `true` if the NodeList has changed ; `false` otherwise
 */
function hasNodeListChanged(prev: NodeList, current: NodeList): boolean {
	const arrPrev = Array.from(prev);
	const arrCurrent = Array.from(current);
	return (arrPrev.length + arrCurrent.length) != 0 && (arrPrev.length !== arrCurrent.length || arrPrev.some((el, i) => el !== arrCurrent[i]));
}

/** Sorts an array of objects on a given string key, in A-Z order
 * @returns The sorted array
 */
function sortElems(arr: Record<string,any>[], sort: string) {
	return arr.sort((a, b) => (`${a[sort]}`.toLowerCase() < `${b[sort]}`.toLowerCase()) ? -1 : 1);
}

export {
	cleanRelatedItem,
	hasNodeListChanged,
	sortElems
};