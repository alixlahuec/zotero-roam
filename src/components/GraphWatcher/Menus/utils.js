import { makeTimestamp, readDNP } from "../../../utils";
import { menuPrefix, menuClasses } from "../classes";

const addPageMenus = () => {
	let newPages = Array.from(document.querySelectorAll("h1.rm-title-display"))
		.filter(page => !(page.parentElement.querySelector(`[class*=${menuPrefix}]`)));
	for(const page of newPages) {
		let title = page.querySelector("span") ? page.querySelector("span").innerText : page.innerText;
		// DEP: page menu trigger setting
		// TODO: add Roam page UIDs as data-uid below
		let menu = document.createElement("div");
		menu.setAttribute("data-title", title);
		// Case 1 (ref-citekey) : on-page menu
		if(title.startsWith("@")){
			menu.classList.add(menuClasses.citekey);
			menu.setAttribute("data-citekey", title.slice(1));
		} else if(title.match(/(.+) ([0-9]+).{2}, ([0-9]{4})/g)) {
			// Case 2 (DNP) : "XX items added"
			let dnp_date = readDNP(title, { as_date: false });
			menu.classList.add(menuClasses.dnp);
			menu.setAttribute("data-dnp-date", JSON.stringify(dnp_date));
		} else {
			// Case 3 (all other pages) : "XX abstracts", "YY tagged items"
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
function cleanRelatedItem(item, roamCitekeys){
	let creator = item.meta.creatorSummary || "";
	let pub_year = item.meta.parsedDate ? `(${new Date(item.meta.parsedDate).getUTCFullYear()})` : "";
	return {
		abstract: item.data.abstractNote || "",
		added: item.data.dateAdded,
		inGraph: roamCitekeys.has("@" + item.key) ? roamCitekeys.get("@" + item.key) : false,
		itemType: item.data.itemType,
		key: item.key,
		location: item.library.type + "s/" + item.library.id,
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
