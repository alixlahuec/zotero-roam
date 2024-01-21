import { categorizeLibraryItems, cleanLibraryItem, identifyChildren } from "../../utils";

import { SettingsCopy } from "Types/extension";
import { RCitekeyPages, ZCleanItemTop, ZItem, ZItemTop } from "Types/transforms";


/** Categorizes library data into top-level items, annotations/notes, and PDFs with their metadata, children, and links */
function cleanLibrary(arr: ZItem[], roamCitekeys: RCitekeyPages): ZCleanItemTop[] {
	const lib = categorizeLibraryItems(arr);

	return lib.items
		.map((item: ZItemTop) => {
			const itemKey = item.data.key;
			const location = item.library.type + "s/" + item.library.id;
			const { pdfs, notes } = identifyChildren(itemKey, location, { pdfs: lib.pdfs, notes: lib.notes });

			return cleanLibraryItem(item, pdfs, notes, roamCitekeys);
		});
}


/** Creates a reference to a simplified item with default format */
function formatItemReferenceWithDefault(simplifiedItem: ZCleanItemTop, copySettings: SettingsCopy): string {
	const { authors, key, title, year } = simplifiedItem;
	const { preset, template, useAsDefault } = copySettings;

	switch(useAsDefault){
	case "template": {
		let output = template;
        
		const specs = {
			authors,
			key,
			title,
			year
		};

		for(const prop in specs){
			output = output.replaceAll(`{{${prop}}}`, `${specs[prop]}`);
		}

		return output;
	}
	case "preset":
	default:
		return formatItemReferenceForCopy(simplifiedItem, preset);
	}
}


/** Converts a simplified item into a given string format for clipboard copy */
function formatItemReferenceForCopy(
	simplifiedItem: ZCleanItemTop,
	format: "citation" | "citekey" | "page-reference" | "raw" | "tag"
): string{
	const citekey = simplifiedItem.key;
	const pageRef = "[[@" + citekey + "]]";

	switch(true){
	case (format == "page-reference"):
		return pageRef;
	case (format == "raw"):
		return citekey;
	case (format == "tag"):
		return "#" + pageRef;
	case (format == "citation"):
		return "[" + simplifiedItem.authors + " (" + simplifiedItem.year + ")](" + pageRef + ")";
	case (format == "citekey"):
	default:
		return "@" + citekey;
	}
}

export {
	cleanLibrary,
	formatItemReferenceWithDefault
};

