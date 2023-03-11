import { emitCustomEvent } from "../events";
import { cleanErrorIfAxios, parseDOI, searchEngine } from "../utils";

import { citoidClient, semanticClient, zoteroClient } from "./clients";
import { matchWithCurrentData } from "./helpers";


/**
 * @typedef{{
 * title: String,
 * uid: String
 * }}
 * RoamPage
 */

/**
 * @typedef{Map<String, (ZoteroTag|ZoteroTag[])>}
 * TagMap
 */

/**
 * @typedef{{
 * token: String,
 * zotero: ZoteroTag[],
 * roam: RoamPage[]
 * }}
 * TagEntry
 */

/** Compares two Zotero tags based on tag string and type, to determine if they are duplicates
 * @param {ZoteroTag} tag1 - The first tag to compare
 * @param {ZoteroTag} tag2 - The second tag to compare
 * @returns {Boolean} The result of the comparison - `true` if the tags are duplicates of each other, `false` otherwise
 */
function areTagsDuplicate(tag1, tag2){
	[tag1, tag2].forEach(tag => {
		if(tag.constructor !== Object || !tag.tag || !tag.meta){
			throw new Error(`Received bad input: ${JSON.stringify(tag)}, expected a Zotero tag`);
		}
		if(tag.meta.type === undefined){
			throw new Error(`Received bad input: ${JSON.stringify(tag)}, expected the tag to have a type`);
		}
	});

	return tag1.meta.type == tag2.meta.type && tag1.tag == tag2.tag;
}

/** Categorizes Zotero tags into tokens, based on similar spellings
 * @param {String[]} z_data - The tags to be categorized, as Strings
 * @param {TagMap} tagMap - The map of Zotero tags
 * @returns {TagEntry[]} The Array of tokenized tags, sorted alphabetically
 */
function categorizeZoteroTags(z_data, tagMap){
	const output = [];
	const zdata = Array.from(z_data).sort((a,b) => a > b ? -1 : 1);
	
	for(const elem of zdata){
		try {
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
		} catch(e) {
			throw new Error(`Failed to categorize ${elem}: ` + e.message);
		}
	}

	return output.sort((a,b) => a.token < b.token ? -1 : 1);
}

/** Deletes Zotero tags through the `/[library]/tags` endpoint of the Zotero API
 * @param {String[]} tags - The names of the tags to be deleted
 * @param {ZLibrary} library - The targeted Zotero library
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
		window.zoteroRoam?.warn?.({
			origin: "API",
			message: "API limits exceeded",
			detail: "Only 50 Zotero tags can be deleted at once. Any additional tags selected will be ignored."
		});
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

/** Retrieves additional data from the Zotero API, when the original results are greater than the limit of n = 100.
 *  A minimum of parameters are required so that the function can be used for all data types.
 * @param {{dataURI: String, apikey: String, since?: Number}} req - The parameters of the request 
 * @param {Number} totalResults - The total number of results indicated by the original response 
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

	let responses = null;

	try {
		responses = await Promise.all(apiCalls);
		return responses.map(res => res.data).flat(1);
	} catch(error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch additional data",
			context: {
				dataURI,
				error: cleanErrorIfAxios(error),
				responses,
				totalResults
			}
		});
		return Promise.reject(error);
	}
}

/** Retrieves the bibliography for a list of Zotero items.
 * @param {String[]} itemKeys - The Zotero keys of the targeted items
 * @param {ZLibrary} library - The library of the targeted items
 * @returns The generated bibliography
 */
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
 * @param {ZLibrary} library - The item's Zotero library
 * @param {ConfigBibliography} config - Optional parameters to use in the API call
 * @returns {Promise<string>}
 */
async function fetchBibliography(itemKey, library, config = {}) {
	const { apikey, path } = library;
	const dataURI = `${path}/items/${itemKey}`;
	// See https://www.zotero.org/support/dev/web_api/v3/basics#parameters_for_format_bib_includecontent_bib_includecontent_citation
	const { linkwrap = 0, locale = "en-US", style = "chicago-note-bibliography" } = config;

	let response = null;

	try {
		response = await zoteroClient.get(
			dataURI,
			{
				headers: { "Zotero-API-Key": apikey },
				params: {
					include: "bib",
					linkwrap,
					locale,
					style
				}
			}
		);

		return response.data.bib;
	} catch(error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch bibliography",
			context: {
				config,
				dataURI,
				error: cleanErrorIfAxios(error),
				response
			}
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/data/citation/zotero` endpoint of the Wikipedia API
 * @param {String} query - The URL for which to request Zotero metadata
 * @returns {Promise<{item: Object, query: String}>} The metadata for the URL
 */
async function fetchCitoid(query) {
	let response = null;
	try {
		response = await citoidClient.get(encodeURIComponent(query));
		return {
			item: response.data[0],
			query
		};
	} catch(error){
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch metadata from Wikipedia",
			context: {
				error: cleanErrorIfAxios(error),
				query,
				response
			}
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/[library]/deleted` endpoint of the Zotero API
 * @param {ZLibrary} library - The targeted Zotero library
 * @param {Number} since - A library version
 * @returns {Promise<ZoteroDeleted>} Elements deleted from Zotero since the specified version
 */
async function fetchDeleted(library, since) {
	const { apikey, path } = library;

	let response = null;

	try {
		response = await zoteroClient.get(
			`${path}/deleted`, 
			{ 
				headers: { "Zotero-API-Key": apikey },
				params: { since } 
			}
		);
		return response.data;
	} catch(error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch deleted data",
			context: {
				error: cleanErrorIfAxios(error),
				response
			}
		});
		return Promise.reject(error);
	}
}

/** Requests data from the Zotero API, based on a specific data URI
 * @fires zotero-roam:update
 * @param {DataRequest} req - The parameters of the request 
 * @param {{match?: Object[]}} config - Additional parameters
 * @param {*} queryClient - The current React Query client
 * @returns {Promise<{data: ZItem[], lastUpdated: Number}>}
 */
async function fetchItems(req, { match = [] } = {}, queryClient) {
	const { apikey, dataURI, library: { path }, since = 0 } = req;
	const paramsQuery = new URLSearchParams("");
	paramsQuery.set("since", since);
	paramsQuery.set("start", "0");
	paramsQuery.set("limit", "100");

	const defaultOutcome = {
		data: null,
		error: null,
		library: path,
		since,
		success: null,
		type: "items"
	};

	let response = null;
	let modified = null;
	let deleted = null;

	try {
		response = await zoteroClient.get(`${dataURI}?${paramsQuery.toString()}`, 
			{ 
				headers: { "Zotero-API-Key": apikey } 
			});
		const { data, headers } = response;
		modified = data;

		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);

		if(totalResults > 100){
			const additional = await fetchAdditionalData({ dataURI, apikey, since }, totalResults);
			modified.push(...additional);
		}

		deleted = { items: [] };
		// DO NOT request deleted items since X if since = 0 (aka, initial data request)
		// It's a waste of a call
		if(since > 0){
			// Retrieve deleted items, if any
			deleted = await fetchDeleted({ apikey, path }, since);

			const tagsQueryKey = ["tags", { library: path }];
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
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch items",
			context: {
				data: modified,
				deleted,
				error: cleanErrorIfAxios(error),
				response
			}
		});
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
 * @returns {Promise<ZoteroPermissionsResponse>} The API key's permissions
 */
async function fetchPermissions(apikey) {
	try {
		const { data } = await zoteroClient.get(`keys/${apikey}`, { headers: { "Zotero-API-Key": apikey } });
		return data;
	} catch(error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch permissions"
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/paper` endpoint of the Semantic Scholar API
 * @param {String} doi - The DOI of the targeted item, assumed to have already been checked and parsed.
 * @returns {Promise<{doi: String, citations: Object[], references: Object[]}>} Citation data for the item
**/
async function fetchSemantic(doi) {
	let response = null;

	try {
		response = await semanticClient.get(`${doi}`);
		const { data: { citations, references } } = response;
		return { 
			doi, 
			citations: parseSemanticDOIs(citations), 
			references: parseSemanticDOIs(references) 
		};
	} catch(error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch data from SemanticScholar",
			context: {
				error: cleanErrorIfAxios(error),
				response
			}
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/[library]/tags` endpoint of the Zotero API
 * @param {ZLibrary} library - The targeted Zotero library
 * @returns {Promise<{data: Object, lastUpdated: Number}>} The library's tags
 */
async function fetchTags(library) {
	const { apikey, path } = library;

	let response = null;
	let tags = null;

	try {
		response = await zoteroClient.get(`${path}/tags?limit=100`, { headers: { "Zotero-API-Key": apikey } });
		const { data, headers } = response;
		tags = data;

		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);

		if(totalResults > 100){
			const additional = await fetchAdditionalData({ dataURI: `${path}/tags`, apikey }, totalResults);
			tags.push(...additional);
		}

		return { 
			data: makeTagList(tags), 
			lastUpdated: Number(lastUpdated)
		};
	} catch(error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch tags",
			context: {
				error: cleanErrorIfAxios(error),
				path,
				tags
			}
		});
		return Promise.reject(error);
	}
}

/** Creates a dictionary from a String Array
 * @param {String[]} arr - The array from which to make the dictionary
 * @returns {Object.<string, string[]>} An object where each entry is made up of a key (String ; a given letter or character, in lowercase) and the strings from the original array that begin with that letter or character (in any case).
 */
function makeDictionary(arr) {
	return arr.reduce((dict, elem) => {
		try {
			const initial = elem.charAt(0).toLowerCase();
			if (dict[initial]) {
				dict[initial].push(elem);
			} else {
				dict[initial] = [elem];
			}
		} catch (e) {
			throw new Error(`Could not add ${JSON.stringify(elem)} to dictionary`);
		}
		return dict;
	}, {});
}

/** Converts Zotero tags data into a categorized list
 * @param {ZoteroTag[]} tags - The tags data from Zotero to categorize
 * @returns {Object.<string, TagEntry[]>} The list of categorized tags
 */
function makeTagList(tags){
	try {
		const tagMap = makeTagMap(tags);
		const zdict = makeDictionary(Array.from(tagMap.keys()));
		const zkeys = Object.keys(zdict).sort((a, b) => a < b ? -1 : 1);

		const output = {};
		zkeys.forEach(key => {
			output[key] = categorizeZoteroTags(zdict[key], tagMap);
		});
		return output;
	} catch(e) {
		throw new Error("Could not create tag list : " + e.message);
	}
}

/** Converts Zotero tags data into a Map
 * @param {ZoteroTag[]} tags - The tags data from Zotero from which to create the Map
 * @returns {TagMap} A Map where each entry groups together Zotero tags with the exact same spelling, but a different type
 */
function makeTagMap(tags){
	return tags.reduce(
		(map, tag) => updateTagMap(map, tag),
		new Map()
	);
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
	});
}

/** Adds a new entry to a tag map, if it doesn't already exist
 * @param {TagMap} map - The targeted tag map
 * @param {ZoteroTag} tagEntry - The entry to be added
 * @returns The updated tag map
 */
function updateTagMap(map, tagEntry){
	const { tag } = tagEntry;

	// If the map already has an entry for the tag, try to append the new entry
	if(map.has(tag)) {
		const entry = map.get(tag);

		if(entry.constructor === Array) {
			// Only append if no duplicate exists
			if(entry.every(el => !areTagsDuplicate(tagEntry, el))) {
				map.set(tag, [...entry, tagEntry]);
			}
		} else if(entry.constructor === Object) {
			if(!areTagsDuplicate(tagEntry, entry)) {
				map.set(tag, [entry, tagEntry]);
			}
		} else {
			throw new Error(`Map entry is of unexpected type ${entry.constructor.name}, expected Array or Object`);
		}
	// Else add the entry to the map
	} else {
		map.set(tag, tagEntry);
	}
	return map;
}

/** Adds new items to a Zotero library, with optional collections & tags.
 * @param {Object[]} items -  The items to be added to Zotero.
 * @param {{library: ZLibrary, collections: String[], tags: String[]}} config - The options to be used for the import. 
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
 * @param {ZLibrary} library - The targeted Zotero library
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
	areTagsDuplicate,
	deleteTags,
	fetchAdditionalData,
	fetchBibEntries,
	fetchBibliography,
	fetchCitoid,
	fetchDeleted,
	fetchItems,
	fetchPermissions,
	fetchSemantic,
	fetchTags,
	makeDictionary,
	makeTagList,
	parseSemanticDOIs,
	updateTagMap,
	writeCitoids,
	writeItems
};
