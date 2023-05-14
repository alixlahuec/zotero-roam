import { menuClasses, menuPrefix } from "../classes";
import { findRoamPage } from "Roam";

import { identifyChildren, makeTimestamp, readDNP } from "../../../utils";
import { AsBoolean } from "Types/helpers";
import { RCitekeyPages, SCleanRelatedItem, ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "Types/transforms";


const dnpRegex = new RegExp(/(.+) ([0-9]+).{2}, ([0-9]{4})/);

/* istanbul ignore next */
const addPageMenus = () => {
	const newPages = Array.from(document.querySelectorAll<HTMLElement>("h1.rm-title-display"))
		.filter(page => !(page.parentElement?.querySelector(`[class*=${menuPrefix}]`)));
	for(const page of newPages) {
		const title = page.querySelector("span")?.innerText || page.innerText;
		const pageUID = findRoamPage(title);
		
		const menu = document.createElement("div");
		menu.setAttribute("data-title", title);
		if(pageUID) { menu.setAttribute("data-uid", pageUID); }

		switch(true){
		case (title.startsWith("@")):
			// (ref-citekey) : on-page menu
			menu.classList.add(menuClasses.citekey);
			menu.setAttribute("data-citekey", title.slice(1));
			break;
		case (dnpRegex.test(title)):
			// (DNP) : "XX items added"
			menu.classList.add(menuClasses.dnp);
			menu.setAttribute("data-dnp-date", JSON.stringify(readDNP(title, { as_date: false })));
			break;
		default:
			// (all other pages) : "XX abstracts", "YY tagged items"
			menu.classList.add(menuClasses.tag);
		}

		page.insertAdjacentElement("afterend", menu);
	}
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
	{ pdfs = [], notes = [] }: { pdfs: ZItemAttachment[], notes: (ZItemAnnotation | ZItemNote)[] },
	roamCitekeys: RCitekeyPages
): SCleanRelatedItem {
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
		meta: [creator, pub_year].filter(AsBoolean).join(" "),
		raw: item,
		timestamp: makeTimestamp(item.data.dateAdded),
		title: item.data.title || ""
	};
}

const findPageMenus = () => {
	return {
		citekeyMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.citekey}]`)),
		dnpMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.dnp}]`)),
		tagMenus: Array.from(document.querySelectorAll(`[class=${menuClasses.tag}]`))
	};
};

export {
	addPageMenus,
	cleanRelatedItem,
	findPageMenus
};
