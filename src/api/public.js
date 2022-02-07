import { fetchBibliography } from "./utils";

/** Returns an item's formatted bibliography as returned by the Zotero API
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {{include: String, linkwrap: Boolean, locale: String, style: String}} config - Optional parameters to use in the API call
 * @param {ZoteroLibrary[]} libraries - The list of available Zotero libraries
 * @param {*} queryClient - The React Query client to use
 * @returns 
 */
async function _getBibliography(item, config, library, queryClient){
	let itemKey = item.data.key;

	// Specify API defaults explicitly, so that they are registered in the query key
	// See https://www.zotero.org/support/dev/web_api/v3/basics#parameters_for_format_bib_includecontent_bib_includecontent_citation
	const { include = "bib", linkwrap = 0, locale = "en-US", style = "chicago-note-bibliography" } = config;
	const apiConfig = { include, linkwrap, locale, style };

	return await queryClient.fetchQuery(
		["bibliography", { itemKey, ...library, ...apiConfig }],
		(_queryKey) => fetchBibliography(itemKey, library, apiConfig)
	);
}

/** Returns all children of a given item available in the query cache
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {*} queryClient - The React Query client to use
 * @returns The item's children
 */
function _getChildren(item, queryClient) {
	let location = item.library.type + "s/" + item.library.id;
	return _getItems("children", { predicate: (queryKey) => queryKey[1].dataURI.startsWith(location) }, queryClient)
		.filter(el => el.data.parentItem == item.data.key);
}

/** Returns the current items in the query cache, with optional configuration
 * @param {("all"|"attachments"|"children"|"items"|"notes"|"pdfs")} select - The type of items to retrieve
 * @param {Object} filters - Optional filters for the item queries
 * @param {*} queryClient - The React Query client to use
 * @returns {ZoteroItem[]} - The requested items
 */
function _getItems(select = "all", filters = {}, queryClient) {
	let items = queryClient.getQueriesData(["items"], filters).map(query => (query[1] || {}).data || []).flat(1);
	switch(select){
	case "items":
		return items.filter(it => !["attachment", "note", "annotation"].includes(it.data.itemType));
	case "attachments":
		return items.filter(it => it.data.itemType == "attachment");
	case "children":
		return items.filter(it => it.data.itemType == "note" || it.data.itemType == "attachment" && it.data.contentType == "application/pdf");
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
function _getTags(library, queryClient) {
	const { apikey, path } = library;
	let data = queryClient.getQueryData(["tags", { apikey, library: path }]);
	return data;
}

export {
	_getBibliography,
	_getChildren,
	_getItems,
	_getTags
};