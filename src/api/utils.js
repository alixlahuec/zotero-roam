import { useQueryClient } from "react-query";

import { zoteroClient, semanticClient, citoidClient } from "./clients";
import { emitCustomEvent } from "../events";
import { parseDOI } from "../utils";

/** Extracts pinned citekeys from a dataset
 * @param {ZoteroItem[]} arr - The dataset of Zotero items to scan
 * @returns {Object[]} The processed dataset : each item gains a `has_citekey` property, and its `key` property is assigned its citekey 
 */
function extractCitekeys(arr){
	return arr.map(item => {
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
 * @param {{dataURI: String, apikey: String, since?: Integer, params?: String}} req - The parameters of the request 
 * @param {Integer} totalResults - The total number of results indicated by the original response 
 * @returns {Promise<Object[]>} The additional results to the original request
 */
async function fetchAdditionalData(req, totalResults) {
	let { dataURI, apikey, params = "", since = null } = req;
	let nbExtraCalls = Math.ceil((totalResults / 100) - 1);
	let apiCalls = [];

	for(let i=1; i <= nbExtraCalls; i++){
		let reqParams = new URLSearchParams(params);
		if(since){
			reqParams.set("since", since);
		}
		reqParams.set("start", 100*i);
		reqParams.set("limit", 100);
		apiCalls.push(zoteroClient.get(`${dataURI}?${reqParams.toString()}`, { headers: { "Zotero-API-Key": apikey } }));
	}

	return Promise.all(apiCalls)
		.then(([...responses]) => {
			return responses.map(res => res.data).flat(1);
		})
		.catch((error) => {
			return error;
		});
}

async function fetchBibliography(req, { include = "bib", style, linkwrap, locale } = {}) {
	let { apikey, itemKey, location } = req;

	return zoteroClient.get(`${location}/items/${itemKey}`, {
		headers: {
			"Zotero-API-Key": apikey
		},
		params: {
			include,
			linkwrap,
			locale,
			style
		}})
		.then((response) => {
			return response[include];
		})
		.catch((error) => {
			return error;
		});
}

/** Requests data from the Zotero API, based on a specific data URI
 * @fires zotero-roam:update
 * @param {{apikey: String, dataURI: String, params: String, name: String, library: String}} req - The parameters of the request 
 * @param {{match: Object[]}} config - Additional parameters
 * @returns {Promise<{data: Object[], lastUpdated: Integer}>}
 */
async function fetchItems(req, { match = [] } = {}) {
	let { apikey, dataURI, params, library, since = 0 } = req;
	let paramsQuery = new URLSearchParams(params);
	paramsQuery.set("since", since);
	paramsQuery.set("start", 0);
	paramsQuery.set("limit", 100);

	return zoteroClient.get(`${dataURI}?${paramsQuery.toString()}`, { headers: { "Zotero-API-Key": apikey } })
		.then(async (response) => {
			let { data: modified, headers } = response;
			let { "last-modified-version": lastUpdated, "total-results": totalResults } = headers;
			totalResults = Number(totalResults);
			if(totalResults > 100){
				let additional = await fetchAdditionalData({ dataURI, apikey, params, since }, totalResults);
				modified.push(...additional);
			}

			let deleted = [];
			// DO NOT request deleted items since X if since = 0 (aka, initial data request)
			// It's a waste of a call
			if(since > 0 && modified.length > 0){
				// Retrieve deleted items, if any
				deleted = await fetchDeleted({ apikey, path: library }, since);

				// Refetch tags data
				const client = useQueryClient();
				let tagsQueryKey = ["tags", { library: library, apikey: apikey }];
				let { lastUpdated: latest_tags_version } = client.getQueryData(tagsQueryKey) || {}; // TODO: Check if getQueryData needs exact matching - if not, remove the apikey portion of line above
				if(Number(latest_tags_version) < Number(lastUpdated)){
					client.refetchQueries(tagsQueryKey);
				}

				emitCustomEvent("update", {
					success: true,
					request: req,
					data: modified
				});
			}

			return {
				data: matchWithCurrentData({ modified, deleted: deleted.items }, match, { with_citekey: true }),
				lastUpdated: Number(lastUpdated)
			};
		})
		.catch((error) => {
			emitCustomEvent("update", {
				success: false,
				request: req,
				error
			});
			return error;
		});
}

/** Requests data from the `/keys` endpoint of the Zotero API
 * @param {String} apikey - The targeted API key
 * @returns {Promise<ZoteroKey>} The API key's permissions
 */
async function fetchPermissions(apikey) {
	return zoteroClient.get(`keys/${apikey}`, { headers: { "Zotero-API-Key": apikey } })
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			return error;
		});
}

/** Requests data from the `/[library]/tags` endpoint of the Zotero API
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @returns {Promise<{data: Object[], lastUpdated: Integer}>} The library's tags
 */
async function fetchTags(library) {
	const { apikey, path } = library;
	return zoteroClient.get(`${path}/tags?limit=100`, { headers: { "Zotero-API-Key": apikey } })
		.then(async (response) => {
			let { data, headers } = response;
			let { "last-modified-version": lastUpdated, "total-results": totalResults } = headers;
			totalResults = Number(totalResults);
			if(totalResults > 100){
				let additional = await fetchAdditionalData({ dataURI: `${path}/tags`, apikey}, totalResults);
				data.push(...additional);
			}

			return { 
				data, 
				lastUpdated: Number(lastUpdated)
			};
		})
		.catch((error) => {
			return error;
		});
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

	return zoteroClient.get(`${path}/collections?since=${since}`, { headers: { "Zotero-API-Key": apikey } })
		.then(async (response) => {
			let { data: modified, headers } = response;
			let { "last-modified-version": lastUpdated, "total-results": totalResults } = headers;
			totalResults = Number(totalResults);
			if(totalResults > 100){
				let additional = await fetchAdditionalData({ dataURI: `${path}/collections`, apikey, since}, totalResults);
				modified.push(...additional);
			}

			let deleted = [];
			// DO NOT request deleted items since X if since = 0 (aka, initial data request)
			// It's a waste of a call
			if(since > 0 && modified.length > 0){
				deleted = await fetchDeleted(...library, since);

				emitCustomEvent("update-collections", {
					success: true,
					library,
					data: modified
				});
			}

			return {
				data: matchWithCurrentData({ modified, deleted: deleted.collections }, match),
				lastUpdated: Number(lastUpdated)
			};
		})
		.catch((error) => {
			emitCustomEvent("update-collections", {
				success: false,
				library,
				error
			});
			return error;
		});
}

/** Requests data from the `/[library]/deleted` endpoint of the Zotero API
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @param {Integer} since - A library version
 * @returns {Promise<Object>} Elements deleted from Zotero since the specified version
 */
async function fetchDeleted(library, since) {
	const { apikey, path } = library;
	return zoteroClient.get(`${path}/deleted?since=${since}`, { headers: { "Zotero-API-Key": apikey } })
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			return error;
		});
}

/** Requests data from the `/paper` endpoint of the Semantic Scholar API
 * @param {String} doi - The DOI of the targeted item, assumed to have already been checked and parsed.
 * @returns {Promise<{doi: String, citations: Object[], references: Object[]}>} Citation data for the item
**/
async function fetchSemantic(doi) {
	return semanticClient.get(`${doi}`)
		.then((response) => {
			let { citations, references } = response.data;
			// Select & transform citations with valid DOIs
			citations = citations
				.map(cit => {
					let { doi, ...rest } = cit;
					return {
						doi: parseDOI(doi),
						...rest
					};
				})
				.filter(cit => cit.doi);
			// Select & transform references with valid DOIs
			references = references
				.map(ref => {
					let { doi, ...rest } = ref;
					return {
						doi: parseDOI(doi),
						...rest
					};
				})
				.filter(ref => ref.doi);
        
			return { doi, citations, references };
		})
		.catch((error) => {
			return error;
		});
}

/** Requests data from the `/data/citation/zotero` endpoint of the Wikipedia API
 * @param {String} query - The URL for which to request Zotero metadata
 * @returns {Promise<Object>} The Zotero metadata for the URL
 */
async function fetchCitoid(query) {
	return citoidClient.get(encodeURIComponent(query))
		.then((response) => {
			return response.data[0];
		})
		.catch((error) => {
			return error;
		});
}

/** Compares two datasets and merges the changes. As the match is done on the `data.key` property, both items and collections can be matched.
 *  For items, merging involves an additional step to extract citekeys.
 * @param {{modified: ZoteroItem[]|ZoteroCollection[], deleted: ZoteroItem[]|ZoteroCollection[]}} update - The newer dataset
 * @param {Object[]} arr - The older dataset
 * @param {{with_citekey?: Boolean}} config - Additional parameters 
 * @returns {Object[]} - The merged dataset
 */
function matchWithCurrentData(update, arr, { with_citekey = false } = {}) {
	let oldData = arr || [];
	let { modified = [], deleted = [] } = update;

	// Remove deleted items
	if(deleted.length > 0){
		oldData = oldData.filter(item => !deleted.includes(item.data.key));
	}
	// If the data has citekeys, transform before pushing
	if(with_citekey){
		modified = extractCitekeys(modified);
	}

	// Update datastore
	if(modified.length == 0){
		return oldData;
	} else if(oldData.length == 0){
		return modified;
	} else {
		let [...datastore] = arr;
		modified.forEach(item => {
			let duplicateIndex = datastore.findIndex(i => i.data.key == item.data.key);
			if(duplicateIndex == -1){
				datastore.push(item);
			} else {
				datastore[duplicateIndex] = item;
			}
		});
		return datastore;
	}
}

/** Adds new items to a Zotero library, with optional collections & tags.
 * @param {ZoteroItem[]|Object[]} citoids -  The items to be added to Zotero.
 * @param {{library: {apikey: String, path: String}, collections: String[], tags: String[]}} config - The options to be used for the import. 
 * @returns 
 */
async function writeItems(items, {library, collections = [], tags = []} = {}){
	const { apikey, path } = library;
	const clean_tags = tags.map(t => { return { tag: t }; });

	const data = items.map(citoid => {
		// Remove key and version from the data object
		const { key, version, ...item } = citoid;

		return {
			...item,
			collections,
			tags: clean_tags
		};
	});

	return zoteroClient.post(`${path}/items`, {
		headers: { "Zotero-API-Key": apikey },
		data: JSON.stringify(data)
	});
}

export {
	fetchBibliography,
	fetchCitoid,
	fetchCollections,
	fetchItems,
	fetchPermissions,
	fetchSemantic,
	fetchTags,
	writeItems
};
