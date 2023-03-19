import { categorizeLibraryItems, cleanLibraryItem, identifyChildren } from "../../utils";

import { RoamCitekeysList , ZCleanItemTop, ZItem, ZItemTop } from "Types/transforms";



/** Categorizes library data into top-level items, annotations/notes, and PDFs with their metadata, children, and links */
function cleanLibrary(arr: ZItem[], roamCitekeys: RoamCitekeysList): ZCleanItemTop[] {
	const lib = categorizeLibraryItems(arr);

	return lib.items
		.map((item: ZItemTop) => {
			const itemKey = item.data.key;
			const location = item.library.type + "s/" + item.library.id;
			const { pdfs, notes } = identifyChildren(itemKey, location, { pdfs: lib.pdfs, notes: lib.notes });

			return cleanLibraryItem(item, pdfs, notes, roamCitekeys);
		});
}

export {
	cleanLibrary
};