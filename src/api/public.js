import { cleanBibliographyHTML, fetchBibEntries, fetchBibliography } from "./utils";
import { _getItems } from "../extension";

/** Compiles a list of bibliographic entries from citekeys
 * @param {String[]} citekeys - The items' citekeys
 * @param {ZoteroLibrary[]} libraries - The loaded libraries
 * @param {*} queryClient - The current Roam Query client
 * @returns The compiled bibliography
 */
export async function _getBibEntries(citekeys, { libraries, queryClient }){
	const libraryItems = _getItems("items", {}, { queryClient });
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
 * @param {ConfigBibliography} config - Optional parameters to use in the API call
 * @param {{libraries: ZoteroLibrary[]}} requests - The user's current requests
 * @returns 
 */
export async function _getBibliography(item, config, { libraries }){
	const location = item.library.type + "s/" + item.library.id;
	const library = libraries.find(lib => lib.path == location);

	const itemKey = item.data.key;
	const bib = await fetchBibliography(itemKey, library, config);
	return cleanBibliographyHTML(bib);
}
