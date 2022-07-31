import { cleanBibliographyHTML, fetchBibEntries, fetchBibliography } from "./utils";
import * as namespace from "./public";

/** Compiles a list of bibliographic entries from citekeys
 * @param {String[]} citekeys - The items' citekeys
 * @param {ZoteroLibrary[]} libraries - The loaded libraries
 * @param {*} queryClient - The current Roam Query client
 * @returns {String} The compiled bibliography
 */
export async function _getBibEntries(citekeys, libraries, queryClient){
	let libraryItems = namespace._getItems("items", {}, queryClient);
	const groupedList = citekeys.reduce((obj, citekey) => {
		const libItem = libraryItems.find(it => it.key == citekey);
		if(libItem){
			const location = libItem.library.type + "s/" + libItem.library.id;
			if(Object.keys(obj).includes(location)){
				obj[location].push(libItem.data.key);
			} else {
				obj[location] = [libItem.data.key];
			}
		}
		return obj;
	}, {});

	const bibEntries = [];

	Object.keys(groupedList)
		.forEach(libPath => {
			const library = libraries.find(lib => lib.path == libPath);
			if(library){
				bibEntries.push(fetchBibEntries(groupedList[libPath], library));
			}
		});
	
	const bibOutput = await Promise.all(bibEntries);
	
	return bibOutput.join("\n");

}

/** Returns an item's formatted bibliography as returned by the Zotero API
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {ZoteroLibrary} library - The library where the Zotero item is located
 * @param {{include: String, linkwrap: Boolean, locale: String, style: String}} config - Optional parameters to use in the API call
 * @returns 
 */
export async function _getBibliography(item, library, config){
	let itemKey = item.data.key;
	let bib = await fetchBibliography(itemKey, library, config);
	return cleanBibliographyHTML(bib);
}

/** Returns all children of a given item available in the query cache
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {*} queryClient - The React Query client to use
 * @returns The item's children
 */
export function _getChildren(item, queryClient) {
	let location = item.library.type + "s/" + item.library.id;
	return namespace._getItems("children", { predicate: (queryKey) => queryKey[1].dataURI.startsWith(location) }, queryClient)
		.filter(el => el.data.parentItem == item.data.key);
}

export function _getCollections(library, queryClient){
	const { apikey, path } = library;
	let datastore = queryClient.getQueryData(["collections", { apikey, library: path }]);
	return datastore.data;
}

/** Returns the current items in the query cache, with optional configuration
 * @param {("all"|"annotations"|"attachments"|"children"|"items"|"notes"|"pdfs")} select - The type of items to retrieve
 * @param {Object} filters - Optional filters for the item queries
 * @param {*} queryClient - The React Query client to use
 * @returns {ZoteroItem[]} - The requested items
 */
export function _getItems(select = "all", filters = {}, queryClient) {
	let items = queryClient.getQueriesData(["items"], filters).map(query => (query[1] || {}).data || []).flat(1);
	switch(select){
	case "items":
		return items.filter(it => !["attachment", "note", "annotation"].includes(it.data.itemType));
	case "attachments":
		return items.filter(it => it.data.itemType == "attachment");
	case "children":
		return items.filter(it => ["note", "annotation"].includes(it.data.itemType) || (it.data.itemType == "attachment" && it.data.contentType == "application/pdf"));
	case "annotations":
		return items.filter(it => it.data.itemType == "annotation");
	case "notes":
		return items.filter(it => it.data.itemType == "note");
	case "pdfs":
		return items.filter(it => it.data.itemType == "attachment" && it.data.contentType == "application/pdf");
	case "all":
	default:
		return items;
	}
}

/** Returns the current tags map in the query cache, for a given library
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @param {*} queryClient - The React Query client to access
 * @returns 
 */
export function _getTags(library, queryClient) {
	const { apikey, path } = library;
	let datastore = queryClient.getQueryData(["tags", { apikey, library: path }]);
	return datastore.data;
}
