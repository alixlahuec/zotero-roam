import { categorizeLibraryItems, cleanLibraryItem, identifyChildren } from "../../utils";

import { ZoteroAPI } from "Types/externals/zotero";
import { RoamCitekeysList } from "Types/roam";
import { ZCleanItemTop } from "Types/zotero";


/** Categorizes library data into top-level items, annotations/notes, and PDFs with their metadata, children, and links */
function cleanLibrary(arr: ZoteroAPI.Item[], roamCitekeys: RoamCitekeysList): ZCleanItemTop[] {
	const lib = categorizeLibraryItems(arr);

	return lib.items
		.map((item: ZoteroAPI.ItemTop) => {
			const itemKey = item.data.key;
			const location = item.library.type + "s/" + item.library.id;
			const { pdfs, notes } = identifyChildren(itemKey, location, { pdfs: lib.pdfs, notes: lib.notes });

			return cleanLibraryItem(item, pdfs, notes, roamCitekeys);
		});
}

export {
	cleanLibrary
};