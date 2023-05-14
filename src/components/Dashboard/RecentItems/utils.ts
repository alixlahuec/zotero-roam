import { getCitekeyPagesWithEditTime } from "Roam";
import { identifyChildren } from "../../../utils";
import { AsBoolean } from "Types/helpers";
import { ZDataViewContents, ZLibraryContents, ZLogItem } from "Types/transforms";


/** Categorizes a list of Zotero items by recent activity
 * @param itemList - The list of Zotero items
 * @param asRecentAs - The number of days up to which activity should be considered recent
 * @returns The categorized list of items
 */
function makeLogFromItems(itemList: ZLibraryContents, asRecentAs = 7){
	return new Promise((resolve) => {
		setTimeout(() => {
			const { items = [], pdfs = [], notes =[] } = itemList;
			const citPages = getCitekeyPagesWithEditTime();

			// Set up date thresholds
			const today = new Date();
			today.setHours(0,0,0);
			const yesterday = new Date();
			yesterday.setDate(today.getDate() - 1);
			yesterday.setHours(0,0,0);
			const recent = new Date();
			recent.setDate(today.getDate() - asRecentAs);
			recent.setHours(0,0,0);
			
			const dateView = items.reduce<ZDataViewContents>((log, item) => {
				const itemKey = item.key;
				const location = item.library.type + "s/" + item.library.id;
				const creator = item.meta.creatorSummary || "";
				const pub_year = item.meta.parsedDate ? `(${new Date(item.meta.parsedDate).getUTCFullYear()})` : "";

				// Obtain data for the item's Roam page (if it exists)
				const rPage = citPages.get("@" + itemKey);
				const { edited = null, uid = false } = rPage || {};
				const zotero_last_edit = new Date(item.data.dateModified);
				const last_combined_edit = new Date(Math.max(...[edited, zotero_last_edit].filter(AsBoolean).map(d => Number(d))));

				if(last_combined_edit <= recent){
					return log;
				} else {
					// Find the item's children (PDFs/notes/annotations) in the library
					const children = identifyChildren(itemKey, location, { pdfs: pdfs, notes: notes });

					// Push simplified data to the log
					const entry: ZLogItem = {
						abstract: item.data.abstractNote || "",
						children,
						edited: last_combined_edit,
						inGraph: uid,
						itemType: item.data.itemType,
						key: itemKey,
						location,
						meta: [creator, pub_year].filter(AsBoolean).join(" "),
						publication: item.data.publicationTitle || item.data.bookTitle || item.data.university || "",
						raw: item,
						title: item.data.title || "",
					};

					if(last_combined_edit > today) {
						log.today.push(entry);
						log.numItems += 1;
					} else if(last_combined_edit > yesterday){
						log.yesterday.push(entry);
						log.numItems += 1;
					} else if(last_combined_edit > recent){
						log.recent.push(entry);
						log.numItems += 1;
					}

					return log;
				}

			}, {
				today: [],
				yesterday: [],
				recent: [],
				numItems: 0
			});

			Object.values(dateView)
				.filter(Array.isArray)
				.forEach(arr => arr.sort((a,b) => (a.edited < b.edited ? 1 : -1)));

			resolve(dateView);
		}, 0);
	});
}

export {
	makeLogFromItems
};
