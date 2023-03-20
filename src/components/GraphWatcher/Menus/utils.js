import { menuClasses, menuPrefix } from "../classes";
import { findRoamPage } from "Roam";

import { identifyChildren, makeTimestamp, readDNP } from "../../../utils";


const dnpRegex = new RegExp(/(.+) ([0-9]+).{2}, ([0-9]{4})/);

/* istanbul ignore next */
const addPageMenus = () => {
	const newPages = Array.from(document.querySelectorAll("h1.rm-title-display"))
		.filter(page => !(page.parentElement.querySelector(`[class*=${menuPrefix}]`)));
	for(const page of newPages) {
		const title = page.querySelector("span") ? page.querySelector("span").innerText : page.innerText;
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

/**
 * @typedef {{
 * abstract: String,
 * added: String,
 * children: {pdfs: ZoteroAPI.ItemAttachment[], notes: (ZoteroAPI.ItemNote|ZoteroAPI.ItemAnnotation)[]},
 * inGraph: Boolean|String,
 * itemType: String,
 * key: String,
 * location: String,
 * meta: String,
 * raw: ZoteroAPI.ItemTop,
 * timestamp: String,
 * title: String
 * }}
 * CleanRelatedItem
 * @see cleanRelatedItemType
 */

/** Formats an item for display in AuxiliaryDialog
 * @param {ZoteroAPI.ItemTop} item - The item to format
 * @param {{pdfs?: ZoteroAPI.ItemAttachment[], notes?: (ZoteroAPI.ItemNote|ZoteroAPI.ItemAnnotation)[]}} libraryData - The list of attachments in the library
 * @param {RCitekeyPages} roamCitekeys - The map of citekey pages in the Roam graph. Each entry contains the page's UID.  
 * @returns {CleanRelatedItem} The formatted array
 */
function cleanRelatedItem(item, { pdfs = [], notes = [] } = {}, roamCitekeys){
	const creator = item.meta.creatorSummary || "";
	const pub_year = item.meta.parsedDate ? `(${new Date(item.meta.parsedDate).getUTCFullYear()})` : "";
	const itemKey = item.data.key;
	const location = item.library.type + "s/" + item.library.id;

	const children = identifyChildren(itemKey, location, { pdfs: pdfs, notes: notes });

	return {
		abstract: item.data.abstractNote || "",
		added: item.data.dateAdded,
		children,
		inGraph: roamCitekeys.has("@" + item.key) ? roamCitekeys.get("@" + item.key) : false,
		itemType: item.data.itemType,
		key: item.key,
		location,
		meta: [creator, pub_year].filter(Boolean).join(" "),
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
