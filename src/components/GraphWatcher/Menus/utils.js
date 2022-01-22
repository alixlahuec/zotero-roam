import { menuPrefix, menuClasses } from "../classes";
import { findRoamPage } from "../../../roam";
import { makeTimestamp, readDNP } from "../../../utils";

const addPageMenus = () => {
	let newPages = Array.from(document.querySelectorAll("h1.rm-title-display"))
		.filter(page => !(page.parentElement.querySelector(`[class*=${menuPrefix}]`)));
	for(const page of newPages) {
		let title = page.querySelector("span") ? page.querySelector("span").innerText : page.innerText;
		let pageUID = findRoamPage(title);
		// DEP: page menu trigger setting
		
		let menu = document.createElement("div");
		menu.setAttribute("data-title", title);
		if(pageUID) { menu.setAttribute("data-uid", pageUID); }

		switch(true){
		case (title.startsWith("@")):
			// (ref-citekey) : on-page menu
			menu.classList.add(menuClasses.citekey);
			menu.setAttribute("data-citekey", title.slice(1));
			break;
		case (title.match(/(.+) ([0-9]+).{2}, ([0-9]{4})/g)): {
			// (DNP) : "XX items added"
			let dnp_date = readDNP(title, { as_date: false });
			menu.classList.add(menuClasses.dnp);
			menu.setAttribute("data-dnp-date", JSON.stringify(dnp_date));
			break;
		}
		default:
			// (all other pages) : "XX abstracts", "YY tagged items"
			menu.classList.add(menuClasses.tag);
		}

		page.insertAdjacentElement("afterend", menu);
	}
};

/** Formats a list of items for display in AuxiliaryDialog
 * @param {Object[]} items - The item to format
 * @param {Map} roamCitekeys - The map of citekey pages in the Roam graph. Each entry contains the page's UID.  
 * @returns {{
 * abstract: String,
 * added: Date,
 * children: {pdfs: Array, notes: Array},
 * inGraph: Boolean,
 * itemType: String,
 * key: String,
 * location: String,
 * meta: String,
 * raw: Object,
 * timestamp: String,
 * title: String
 * }[]} The formatted array
 * @see cleanRelatedItemType
 */
function cleanRelatedItem(item, {pdfs = [], notes = []} = {}, roamCitekeys){
	let creator = item.meta.creatorSummary || "";
	let pub_year = item.meta.parsedDate ? `(${new Date(item.meta.parsedDate).getUTCFullYear()})` : "";
	let location = item.library.type + "s/" + item.library.id;
	let itemKey = item.data.key;

	let pdfItems = pdfs.filter(p => p.library.type + "s/" + p.library.id == location && p.data.parentItem == itemKey);
	let noteItems = notes.filter(n => n.library.type + "s/" + n.library.id == location && n.data.parentItem == itemKey);

	return {
		abstract: item.data.abstractNote || "",
		added: item.data.dateAdded,
		children: {
			pdfs: pdfItems,
			notes: noteItems
		},
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
