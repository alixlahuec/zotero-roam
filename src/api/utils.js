
import { citoidClient, semanticClient, zoteroClient } from "./clients";
import { makeDictionary, parseDOI, searchEngine } from "../utils";
import { emitCustomEvent } from "../events";

/** Categorizes Zotero tags into tokens, based on similar spellings
 * @param {String[]} z_data - The tags to be categorized, as Strings
 * @param {Map<String,Object>} tagMap - The map of Zotero tags
 * @returns {{token: String, roam: [], zotero: Object[]}[]} The Array of tokenized tags, sorted alphabetically
 */
function categorizeZoteroTags(z_data, tagMap){
	const output = [];
	const zdata = Array.from(z_data).sort((a,b) => a > b ? -1 : 1);
	
	for(const elem of zdata){
		const in_table = output.findIndex(tk => searchEngine(elem, tk.token, { any_case: true, match: "exact", search_compounds: true }));
		const z_item = tagMap.get(elem);
		if(in_table == -1){
			output.push({
				token: elem.toLowerCase(), 
				roam: [],
				zotero: z_item.constructor === Array ? z_item : [z_item]
			});
		} else {
			if(z_item.constructor === Array){
				output[in_table].zotero.push(...z_item);
			} else {
				output[in_table].zotero.push(z_item);
			}
		}
	}
  
	return output.sort((a,b) => a.token < b.token ? -1 : 1);
}

/** Parses the XHTML bibliography for a Zotero item into Roam formatting
 * @param {String} bib - The item's XHTML bibliography
 * @returns The clean bibliography string
 */
function cleanBibliographyHTML(bib){
	// Grab only the string (strip outer divs)
	const bibString = bib.match("<div.*?>(.+?)</div>")[1];
	// Use a textarea element to decode HTML
	const formatter = document.createElement("textarea");
	formatter.innerHTML = bibString;
	let formattedBib = formatter.innerText;
	// Convert italics
	formattedBib = formattedBib.replaceAll(/<\/?i>/g, "__");
	// Convert links
	const linkRegex = /<a href="(.+)">(.+)<\/a>/g;
	formattedBib = formattedBib.replaceAll(linkRegex, "[$2]($1)");

	return formattedBib;
}

/** Deletes Zotero tags through the `/[library]/tags` endpoint of the Zotero API
 * @param {String[]} tags - The names of the tags to be deleted
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @param {Number} version - The last known version of the Zotero library
 * @returns The outcome of the Axios API call
 */
async function deleteTags(tags, library, version){
	const { apikey, path } = library;
	// * Only 50 tags can be deleted at once
	// * Since each deletion is version-dependent, the extension won't support deleting more for now
	// https://www.zotero.org/support/dev/web_api/v3/write_requests#deleting_multiple_tags
	/* istanbul ignore if */
	if(tags.length > 50){
		console.warn("Only 50 Zotero tags can be deleted at once : any additional tags provided will be ignored.");
	}

	const tagList = tags.slice(0,50).map(t => encodeURIComponent(t)).join(" || ");
	return await zoteroClient.delete(
		`${path}/tags`, 
		{ 
			headers: { 
				"Zotero-API-Key": apikey,
				"If-Unmodified-Since-Version": version
			},
			params: {
				tag: tagList
			} 
		}
	);
}

/** Extracts pinned citekeys from a dataset
 * @param {ZoteroItem[]} arr - The dataset of Zotero items to scan
 * @returns {Object[]} The processed dataset : each item gains a `has_citekey` property, and its `key` property is assigned its citekey 
 */
function extractCitekeys(arr){
	const itemList = [...arr];
	return itemList.map(item => {
		item.has_citekey = false;
		if(typeof(item.data.extra) !== "undefined"){
			if(item.data.extra.includes("Citation Key: ")){
				item.key = item.data.extra.match("Citation Key: (.+)")[1];
				item.has_citekey = true;
			}
		}
		return item;
	});
}

/** Retrieves additional data from the Zotero API, when the original results are greater than the limit of n = 100.
 *  A minimum of parameters are required so that the function can be used for all data types.
 * @param {{dataURI: String, apikey: String, since?: Integer}} req - The parameters of the request 
 * @param {Integer} totalResults - The total number of results indicated by the original response 
 * @returns {Promise<Object[]>} The additional results to the original request
 */
async function fetchAdditionalData(req, totalResults) {
	const { dataURI, apikey, since = null } = req;
	const nbExtraCalls = Math.ceil((totalResults / 100) - 1);
	const apiCalls = [];

	for(let i=1; i <= nbExtraCalls; i++){
		const reqParams = new URLSearchParams("");
		if(since){
			reqParams.set("since", since);
		}
		reqParams.set("start", 100*i);
		reqParams.set("limit", 100);
		apiCalls.push(zoteroClient.get(
			`${dataURI}?${reqParams.toString()}`, 
			{ 
				headers: { "Zotero-API-Key": apikey }
			})
		);
	}

	try {
		const responses = await Promise.all(apiCalls);
		return responses.map(res => res.data).flat(1);
	} catch(error) /* istanbul ignore next */ {
		return Promise.reject(error);
	}
}

async function fetchBibEntries(itemKeys, library) {
	const { apikey, path } = library;

	// * Only 100 entries can be retrieved at once
	const apiCalls = [];
	const nbCalls = Math.ceil(itemKeys.length / 100);

	for(let i=1; i <= nbCalls; i++){
		const keyList = itemKeys.slice(100*(i-1), 100*i);
		apiCalls.push(zoteroClient.get(`${path}/items`, {
			headers: {
				"Zotero-API-Key": apikey
			},
			params: {
				include: "biblatex",
				itemKey: keyList.join(",")
			}
		}));
	}

	const bibResults = await Promise.all(apiCalls);
	return bibResults
		.map(res => res.data)
		.flat(1)
		.map(entry => entry.biblatex)
		.join("\n");

}

/** Retrieves an item's formatted bibliographic entry as returned by the Zotero API
 * @param {String} itemKey - The item's Zotero key
 * @param {ZoteroLibrary} library - The item's Zotero library
 * @param {ConfigBibliography} config - Optional parameters to use in the API call
 * @returns
 */
async function fetchBibliography(itemKey, library, config = {}) {
	const { apikey, path } = library;
	// See https://www.zotero.org/support/dev/web_api/v3/basics#parameters_for_format_bib_includecontent_bib_includecontent_citation
	const { include = "bib", linkwrap = 0, locale = "en-US", style = "chicago-note-bibliography" } = config;
	
	try {
		const { data } = await zoteroClient.get(
			`${path}/items/${itemKey}`, 
			{
				headers: { "Zotero-API-Key": apikey },
				params: {
					include,
					linkwrap,
					locale,
					style
				}
			}
		);

		return data[include];
	} catch(error) /* istanbul ignore next */ {
		return Promise.reject(error);
	}
}

/** Requests data from the `/data/citation/zotero` endpoint of the Wikipedia API
 * @param {String} query - The URL for which to request Zotero metadata
 * @returns {Promise<{item: Object, query: String}>} The metadata for the URL
 */
async function fetchCitoid(query) {
	try {
		const { data } = await citoidClient.get(encodeURIComponent(query));
		return {
			item: data[0],
			query
		};
	} catch(error){
		return Promise.reject(error);
	}
}

/** Requests data from the `/[library]/collections` endpoint of the Zotero API
 * @fires zotero-roam:update-collections
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @param {Integer} since - A library version
 * @param {{match: Object[]}} config - Additional parameters
 * @returns {Promise<{data: ZoteroCollection[], lastUpdated: Integer}>} Collections created or modified in Zotero since the specified version
 */
async function fetchCollections(library, since = 0, { match = [] } = {}) {
	const { apikey, path } = library;

	const defaultOutcome = {
		data: null,
		error: null,
		library: path,
		since,
		success: null,
		type: "collections"
	};

	try {
		const { data: modified, headers } = await zoteroClient.get(
			`${path}/collections`,
			{ 
				headers: { "Zotero-API-Key": apikey },
				params: { since }
			});
		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);
		if(totalResults > 100){
			const additional = await fetchAdditionalData({ dataURI: `${path}/collections`, apikey, since }, totalResults);
			modified.push(...additional);
		}

		let deleted = { collections: [] };

		// DO NOT request deleted items since X if since = 0 (aka, initial data request)
		// It's a waste of a call
		if(since > 0 && modified.length > 0){
			deleted = await fetchDeleted(library, since);

			emitCustomEvent("update", {
				...defaultOutcome,
				data: modified,
				success: true
			});
		}

		return {
			data: matchWithCurrentData({ modified, deleted: deleted.collections }, match),
			lastUpdated: Number(lastUpdated)
		};
	} catch(error) /* istanbul ignore next */ {
		emitCustomEvent("update", {
			...defaultOutcome,
			error,
			success: false
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/[library]/deleted` endpoint of the Zotero API
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @param {Integer} since - A library version
 * @returns {Promise<Object>} Elements deleted from Zotero since the specified version
 */
async function fetchDeleted(library, since) {
	const { apikey, path } = library;

	try {
		const { data } = await zoteroClient.get(
			`${path}/deleted`, 
			{ 
				headers: { "Zotero-API-Key": apikey },
				params: { since } 
			}
		);
		return data;
	} catch(error) /* istanbul ignore next */ {
		return Promise.reject(error);
	}
}

/** Requests data from the Zotero API, based on a specific data URI
 * @fires zotero-roam:update
 * @param {DataRequest} req - The parameters of the request 
 * @param {{match: Object[]}} config - Additional parameters
 * @returns {Promise<{data: Object[], lastUpdated: Integer}>}
 */
async function fetchItems(req, { match = [] } = {}, queryClient) {
	const { apikey, dataURI, library: { path }, since = 0 } = req;
	const paramsQuery = new URLSearchParams("");
	paramsQuery.set("since", since);
	paramsQuery.set("start", 0);
	paramsQuery.set("limit", 100);

	const defaultOutcome = {
		data: null,
		error: null,
		library: path,
		since,
		success: null,
		type: "items"
	};

	try {
		const { data: modified, headers } = await zoteroClient.get(`${dataURI}?${paramsQuery.toString()}`, 
			{ 
				headers: { "Zotero-API-Key": apikey } 
			});
		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);
		if(totalResults > 100){
			const additional = await fetchAdditionalData({ dataURI, apikey, since }, totalResults);
			modified.push(...additional);
		}

		let deleted = { items: [] };
		// DO NOT request deleted items since X if since = 0 (aka, initial data request)
		// It's a waste of a call
		if(since > 0){
			// Retrieve deleted items, if any
			deleted = await fetchDeleted({ apikey, path }, since);

			const tagsQueryKey = ["tags", { apikey, library: path }];
			const { lastUpdated: latest_tags_version } = queryClient.getQueryData(tagsQueryKey) || {};
			if(modified.length > 0 || Number(latest_tags_version) < Number(lastUpdated)){
				// Refetch tags data
				queryClient.refetchQueries(tagsQueryKey);

				emitCustomEvent("update", {
					...defaultOutcome,
					data: modified,
					success: true
				});
			}
		}

		return {
			data: matchWithCurrentData({ modified, deleted: deleted.items }, match, { with_citekey: true }),
			lastUpdated: Number(lastUpdated)
		};
	} catch(error){
		emitCustomEvent("update", {
			...defaultOutcome,
			error,
			success: false
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/keys` endpoint of the Zotero API
 * @param {String} apikey - The targeted API key
 * @returns {Promise<ZoteroKey>} The API key's permissions
 */
async function fetchPermissions(apikey) {
	try {
		const { data } = await zoteroClient.get(`keys/${apikey}`, { headers: { "Zotero-API-Key": apikey } });
		return data;
	} catch(error) /* istanbul ignore next */ {
		return Promise.reject(error);
	}
}

/** Requests data from the `/paper` endpoint of the Semantic Scholar API
 * @param {String} doi - The DOI of the targeted item, assumed to have already been checked and parsed.
 * @returns {Promise<{doi: String, citations: Object[], references: Object[]}>} Citation data for the item
**/
async function fetchSemantic(doi) {
	try {
		const { data: { citations, references } } = await semanticClient.get(`${doi}`);
		return { 
			doi, 
			citations: parseSemanticDOIs(citations), 
			references: parseSemanticDOIs(references) 
		};
	} catch(error) /* istanbul ignore next */ {
		return Promise.reject(error);
	}
}

/** Requests data from the `/[library]/tags` endpoint of the Zotero API
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @returns {Promise<{data: Object[], lastUpdated: Integer}>} The library's tags
 */
async function fetchTags(library) {
	const { apikey, path } = library;

	try {
		const { data, headers } = await zoteroClient.get(`${path}/tags?limit=100`, { headers: { "Zotero-API-Key": apikey } });
		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);
		if(totalResults > 100){
			const additional = await fetchAdditionalData({ dataURI: `${path}/tags`, apikey }, totalResults);
			data.push(...additional);
		}
		return { 
			data: makeTagList(data), 
			lastUpdated: Number(lastUpdated)
		};
	} catch(error) /* istanbul ignore next */ {
		return Promise.reject(error);
	}
}

/** Converts Zotero tags data into a categorized list
 * @param {ZoteroTag[]} tags - The tags data from Zotero to categorize
 * @returns The list of categorized tags
 */
function makeTagList(tags){
	const tagMap = makeTagMap(tags);
	const zdict = makeDictionary(Array.from(tagMap.keys()));
	const zkeys = Object.keys(zdict).sort((a,b) => a < b ? -1 : 1);

	const output = {};
	zkeys.forEach(key => {
		output[key] = categorizeZoteroTags(zdict[key], tagMap);
	});
	return output;
}

/** Converts Zotero tags data into a Map
 * @param {ZoteroTag[]} tags - The tags data from Zotero from which to create the Map
 * @returns {Map} A Map where each entry groups together Zotero tags with the exact same spelling, but a different type
 */
function makeTagMap(tags){
	return tags.reduce(
		function(map,t){
			const { tag, meta: { type } } = t;
			if(map.has(tag)){
				const entry = map.get(tag);
				if(entry.constructor === Array){
					if(entry.every(el => el.tag != tag || el.meta.type != type)){
						map.set(tag, [...entry, t]);
					}
				} else if(entry.constructor === Object) {
					if(entry.tag != tag || entry.meta.type != type){
						map.set(tag, [entry, t]);
					}
				}
			} else{
				map.set(tag,t);
			} 
			return map;
		}, 
		new Map());
}

/** Compares two datasets and merges the changes. As the match is done on the `data.key` property, both items and collections can be matched.
 *  For items, merging involves an additional step to extract citekeys.
 * @param {{modified: (ZoteroItem|ZoteroAnnotation)[]|ZoteroCollection[], deleted: (ZoteroItem|ZoteroAnnotation)[]|ZoteroCollection[]}} update - The newer dataset
 * @param {Object[]} arr - The older dataset
 * @param {{with_citekey?: Boolean}} config - Additional parameters 
 * @returns {Object[]} - The merged dataset
 */
function matchWithCurrentData(update, arr = [], { with_citekey = false } = {}) {
	const { modified = [], deleted = [] } = update;
	// If the data has citekeys, transform before pushing
	const modifiedData = with_citekey
		? extractCitekeys([...modified])
		: [...modified];
	const deletedData = [...deleted];

	// Remove deleted items
	const oldData = deletedData.length == 0
		? arr
		: arr.filter(item => !deletedData.includes(item.data.key));

	// Update datastore
	if(modifiedData.length == 0){
		return oldData;
	} else if(oldData.length == 0){
		return modifiedData;
	} else {
		const [...datastore] = oldData;
		modifiedData.forEach(item => {
			const duplicateIndex = datastore.findIndex(i => i.data.key == item.data.key);
			if(duplicateIndex == -1){
				datastore.push(item);
			} else {
				datastore[duplicateIndex] = item;
			}
		});
		return datastore;
	}
}

/** Selects and transforms Semantic items with valid DOIs
 * @param {Object[]} arr - The array of Semantic items to clean
 * @returns The clean Semantic array
 */
function parseSemanticDOIs(arr){
	return arr.map(elem => {
		const { doi, ...rest } = elem;
		return {
			doi: parseDOI(doi),
			...rest
		};
	}).filter(elem => elem.doi);
}

/** Adds new items to a Zotero library, with optional collections & tags.
 * @param {Object[]} citoids -  The items to be added to Zotero.
 * @param {{library: ZoteroLibrary, collections: String[], tags: String[]}} config - The options to be used for the import. 
 * @returns 
 */
function writeCitoids(items, { library, collections = [], tags = [] } = {}){
	const { apikey, path } = library;
	const clean_tags = tags.map(t => { return { tag: t }; });
	// * Only 50 items can be added at once
	// * https://www.zotero.org/support/dev/web_api/v3/write_requests#creating_multiple_objects
	const apiCalls = [];
	const nbCalls = Math.ceil(items.length / 50);

	for(let i=1; i <= nbCalls; i++){
		const itemsData = items
			.slice(50*(i-1),50*i)
			.map(citoid => {
				// Remove key and version from the data object
				const { key, version, ...item } = citoid;
		
				return {
					...item,
					collections,
					tags: clean_tags
				};
			});
		apiCalls.push(zoteroClient.post(`${path}/items`, JSON.stringify(itemsData), { headers: { "Zotero-API-Key": apikey } }));
	}

	return Promise.allSettled(apiCalls);
}

/** Modifies data for existing items in a Zotero library
 * @param {Object[]} dataList - The data array containing the modifications
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @returns The outcome of the Axios API call
 */
function writeItems(dataList, library){
	const { apikey, path } = library;
	// * Only 50 items can be added at once
	// * https://www.zotero.org/support/dev/web_api/v3/write_requests#updating_multiple_objects
	const apiCalls = [];
	const nbCalls = Math.ceil(dataList.length / 50);

	for(let i=1; i <= nbCalls; i++){
		const itemsData = dataList.slice(50*(i-1),50*i);
		apiCalls.push(zoteroClient.post(`${path}/items`, JSON.stringify(itemsData), { headers: { "Zotero-API-Key": apikey } }));
	}

	return Promise.allSettled(apiCalls);
}

export {
	cleanBibliographyHTML,
	deleteTags,
	extractCitekeys,
	fetchAdditionalData,
	fetchBibEntries,
	fetchBibliography,
	fetchCitoid,
	fetchCollections,
	fetchDeleted,
	fetchItems,
	fetchPermissions,
	fetchSemantic,
	fetchTags,
	makeTagList,
	matchWithCurrentData,
	parseSemanticDOIs,
	writeCitoids,
	writeItems
};
