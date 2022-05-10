import { getCitekeyPagesWithEditTime } from "../../../roam";
import { identifyChildren } from "../../../utils";

/** Categorizes a list of Zotero items by recent activity
 * @param {{items: ZoteroItem[], pdfs: ZoteroItem[], notes: ZoteroItem[]}} itemList - The list of Zotero items
 * @param {Number} asRecentAs - The number of days up to which activity should be considered recent
 * @returns The categorized list of items
 */
function makeLogFromItems(itemList, asRecentAs = 7){
	return new Promise((resolve) => {
		setTimeout(() => {
			const { items = [], pdfs = [], notes =[] } = itemList;
			let citPages = getCitekeyPagesWithEditTime();

			// Set up date thresholds
			let today = new Date();
			today.setHours(0,0,0);
			let yesterday = new Date();
			yesterday.setDate(today.getDate() - 1);
			yesterday.setHours(0,0,0);
			let recent = new Date();
			recent.setDate(today.getDate() - asRecentAs);
			recent.setHours(0,0,0);
			
			let dateView = items.reduce((log, item) => {
				let itemKey = item.key;
				let location = item.library.type + "s/" + item.library.id;
				let creator = item.meta.creatorSummary || "";
				let pub_year = item.meta.parsedDate ? `(${new Date(item.meta.parsedDate).getUTCFullYear()})` : "";

				// Obtain data for the item's Roam page (if it exists)
				let rPage = citPages.has("@" + itemKey) ? citPages.get("@" + itemKey) : {};
				let { edited = null, uid = false } = rPage;
				let zotero_last_edit = new Date(item.data.dateModified);
				let last_combined_edit = new Date(Math.max(...[edited, zotero_last_edit].filter(Boolean)));

				if(last_combined_edit <= recent){
					return log;
				} else {
					// Find the item's children (PDFs/notes/annotations) in the library
					let children = identifyChildren(itemKey, location, { pdfs: pdfs, notes: notes });

					// Push simplified data to the log
					let entry = {
						abstract: item.data.abstractNote || "",
						children,
						edited: last_combined_edit,
						inGraph: uid,
						itemType: item.data.itemType,
						key: itemKey,
						location,
						meta: [creator, pub_year].filter(Boolean).join(" "),
						publication: item.data.publicationTitle || item.data.bookTitle || item.data.university || "",
						raw: item,
						title: item.data.title || "",
					};

					if(last_combined_edit > today) {
						log.today.push(entry);
					} else if(last_combined_edit > yesterday){
						log.yesterday.push(entry);
					} else if(last_combined_edit > recent){
						log.recent.push(entry);
					}

					return log;
				}

			}, {
				today: [],
				yesterday: [],
				recent: []
			});

			Object.values(dateView).forEach(arr => arr.sort((a,b) => (a.edited < b.edited ? 1 : -1)));

			resolve(dateView);
		}, 0);
	});
}

export {
	makeLogFromItems
};
