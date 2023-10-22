import { QueryClient } from "@tanstack/query-core";

import { isAxiosError } from "axios";
import { citoidClient, semanticClient, zoteroClient } from "./clients";
import { cleanNewlines, makeDictionary, parseDOI, safely, searchEngine } from "../utils";
import { emitCustomEvent } from "../events";

import { DataRequest } from "Types/extension";
import { CitoidAPI, SemanticScholarAPI, ZoteroAPI } from "Types/externals";
import { Maybe } from "Types/helpers";
import { QueryDataCitoid, QueryDataCollections, QueryDataItems, QueryDataPermissions, QueryDataSemantic, QueryDataTags, QueryKeyTags, ZItem, ZLibrary, ZTagEntry, ZTagList, ZTagMap } from "Types/transforms";


/**
 * @typedef{{
 * title: String,
 * uid: String
 * }}
 * RoamPage
 */

/**
 * @typedef{Map<String, (ZoteroAPI.Tag|ZoteroAPI.Tag[])>}
 * TagMap
 */

/**
 * @typedef{{
 * token: String,
 * zotero: ZoteroAPI.Tag[],
 * roam: RoamPage[]
 * }}
 * TagEntry
 */

type WithHasCitekey<T> = T & { has_citekey: boolean };

/** Compares two Zotero tags based on tag string and type, to determine if they are duplicates
 * @param tag1 - The first tag to compare
 * @param tag2 - The second tag to compare
 * @returns The result of the comparison - `true` if the tags are duplicates of each other, `false` otherwise
 */
function areTagsDuplicate(tag1: ZoteroAPI.Tag, tag2: ZoteroAPI.Tag) {
	[tag1, tag2].forEach(tag => {
		if (tag.constructor !== Object || !tag.tag || !tag.meta) {
			throw new Error(`Received bad input: ${JSON.stringify(tag)}, expected a Zotero tag`);
		}
		if (tag.meta.type === undefined) {
			throw new Error(`Received bad input: ${JSON.stringify(tag)}, expected the tag to have a type`);
		}
	});

	return tag1.meta.type == tag2.meta.type && tag1.tag == tag2.tag;
}

/** Categorizes Zotero tags into tokens, based on similar spellings
 * @param z_data - The tags to be categorized, as Strings
 * @param tagMap - The map of Zotero tags
 * @returns The Array of tokenized tags, sorted alphabetically
 */
function categorizeZoteroTags(z_data: string[], tagMap: ZTagMap): ZTagEntry[] {
	const output: ZTagEntry[] = [];
	const zdata = Array.from(z_data).sort((a, b) => a > b ? -1 : 1);

	for (const elem of zdata) {
		try {
			const in_table = output.findIndex(tk => searchEngine(elem, tk.token, { any_case: true, match: "exact", search_compounds: true }));
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const z_item = tagMap.get(elem)!;
			if (in_table == -1) {
				output.push({
					token: elem.toLowerCase(),
					roam: [],
					zotero: Array.isArray(z_item) ? z_item : [z_item]
				});
			} else {
				if (Array.isArray(z_item)) {
					output[in_table].zotero.push(...z_item);
				} else {
					output[in_table].zotero.push(z_item);
				}
			}
		} catch (e) {
			throw new Error(`Failed to categorize ${elem}: ` + e.message);
		}
	}

	return output.sort((a, b) => a.token < b.token ? -1 : 1);
}

/** Parses the XHTML bibliography for a Zotero item into Roam formatting
 * @param bib - The item's XHTML bibliography
 * @returns The clean bibliography string
 */
function cleanBibliographyHTML(bib: string) {
	let bibString = bib;

	// Strip divs
	const richTags = ["div"];
	richTags.forEach(tag => {
		// eslint-disable-next-line no-useless-escape
		const tagRegex = new RegExp(`<\/?${tag}>|<${tag} .+?>`, "g"); // Covers both the simple case : <tag> or </tag>, and the case with modifiers : <tag :modifier>
		bibString = bibString.replaceAll(tagRegex, "");
	});

	bibString = cleanNewlines(bibString).trim();

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

function cleanErrorIfAxios(error: Error) {
	return safely(() => {
		if (isAxiosError(error)) {
			const { code, message, status, config } = error;
			return {
				code,
				message,
				status,
				config: {
					url: config?.url
				}
			};
		}

		return error.message || error;
	}, error);
}

/** Deletes Zotero tags through the `/[library]/tags` endpoint of the Zotero API
 * @param tags - The names of the tags to be deleted
 * @param library - The targeted Zotero library
 * @param version - The last known version of the Zotero library
 * @returns The outcome of the Axios API call
 */
async function deleteTags(tags: string[], library: ZLibrary, version: number) {
	const { apikey, path } = library;
	// * Only 50 tags can be deleted at once
	// * Since each deletion is version-dependent, the extension won't support deleting more for now
	// https://www.zotero.org/support/dev/web_api/v3/write_requests#deleting_multiple_tags
	/* istanbul ignore if */
	if (tags.length > 50) {
		window.zoteroRoam?.warn?.({
			origin: "API",
			message: "API limits exceeded",
			detail: "Only 50 Zotero tags can be deleted at once. Any additional tags selected will be ignored."
		});
	}

	const tagList = tags.slice(0, 50).map(t => encodeURIComponent(t)).join(" || ");

	return await zoteroClient.delete<ZoteroAPI.Responses.TagsDelete>(
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
 * @param arr - The items to scan
 * @returns The processed dataset : each item gains a `has_citekey` property, and its `key` property is assigned its citekey 
 */
function extractCitekeys<T extends { key: string, data: { extra?: string } }>(arr: T[]): WithHasCitekey<T>[] {
	const itemList = [...arr];
	return itemList.map(item => {
		let { key } = item;
		let has_citekey = false;

		if (typeof (item.data.extra) !== "undefined") {
			if (item.data.extra.includes("Citation Key: ")) {
				key = item.data.extra.match("Citation Key: (.+)")?.[1] || key;
				has_citekey = true;
			}
		}
		return {
			...item,
			key,
			has_citekey
		};
	});
}

/** Retrieves additional data from the Zotero API, when the original results are greater than the limit of n = 100.
 *  A minimum of parameters are required so that the function can be used for all data types.
 * @param req - The parameters of the request 
 * @param totalResults - The total number of results indicated by the original response 
 * @returns The additional results to the original request
 */
async function fetchAdditionalData<T>(
	req: { dataURI: string, apikey: string, since?: number },
	totalResults: number
) {
	const { dataURI, apikey, since = null } = req;
	const nbExtraCalls = Math.ceil((totalResults / 100) - 1);

	const apiCalls: ReturnType<typeof zoteroClient.get<T>>[] = [];

	for (let i = 1; i <= nbExtraCalls; i++) {
		const reqParams = new URLSearchParams("");
		if (since) {
			reqParams.set("since", `${since}`);
		}
		reqParams.set("start", `${100 * i}`);
		reqParams.set("limit", `${100}`);
		apiCalls.push(zoteroClient.get<T>(
			`${dataURI}?${reqParams.toString()}`,
			{
				headers: { "Zotero-API-Key": apikey }
			})
		);
	}

	let responses: unknown[] = [null];

	try {
		const apiResponses = await Promise.all(apiCalls);
		responses = apiResponses;

		return apiResponses.map(res => res.data).flat(1);
	} catch (error) /* istanbul ignore next */ {
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
 * @param itemKeys - The Zotero keys of the targeted items
 * @param library - The library of the targeted items
 * @returns The generated bibliography
 */
async function fetchBibEntries(itemKeys: string[], library: ZLibrary) {
	const { apikey, path } = library;

	// * Only 100 entries can be retrieved at once
	const apiCalls: ReturnType<typeof zoteroClient.get<ZoteroAPI.Responses.ItemsGet<"biblatex">>>[] = [];
	const nbCalls = Math.ceil(itemKeys.length / 100);
	for (let i = 1; i <= nbCalls; i++) {
		const keyList = itemKeys.slice(100 * (i - 1), 100 * i);
		apiCalls.push(zoteroClient.get<ZoteroAPI.Responses.ItemsGet<"biblatex">>(`${path}/items`, {
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
 * @param itemKey - The item's Zotero key
 * @param library - The item's Zotero library
 * @param config - Optional parameters to use in the API call
 * @returns
 */
async function fetchBibliography(itemKey: string, library: ZLibrary, config: Partial<ZoteroAPI.Requests.BibliographyArgs> = {}) {
	const { apikey, path } = library;
	const dataURI = `${path}/items/${itemKey}`;
	// See https://www.zotero.org/support/dev/web_api/v3/basics#parameters_for_format_bib_includecontent_bib_includecontent_citation
	const { linkwrap = 0, locale = "en-US", style = "chicago-note-bibliography" } = config;
	let response: unknown;
	try {
		const { data, ...rest } = await zoteroClient.get<ZoteroAPI.Responses.ItemGet<"bib">>(
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
		response = { data, ...rest };
		return data.bib;
	} catch (error) /* istanbul ignore next */ {
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
 * @param url - The URL for which to request Zotero metadata
 * @returns The metadata for the URL
 */
async function fetchCitoid(url: string): Promise<QueryDataCitoid> {
	let response: unknown;
	try {
		const { data, ...rest } = await citoidClient.get<CitoidAPI.AsZotero[]>(encodeURIComponent(url));
		response = { data, ...rest };

		return {
			item: data[0],
			query: url
		};

	} catch (error) {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch metadata from Wikipedia",
			context: {
				error: cleanErrorIfAxios(error),
				query: url,
				response
			}
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/[library]/collections` endpoint of the Zotero API
 * @fires zotero-roam:update
 * @returns Collections created or modified in Zotero since the specified version
 */
async function fetchCollections(
	library: ZLibrary,
	since = 0,
	{ match = [] }: { match?: ZoteroAPI.Collection[] }
): Promise<QueryDataCollections> {
	const { apikey, path } = library;

	const defaultOutcome = {
		data: null,
		error: null,
		library: path,
		since,
		success: false
	};

	let response: unknown;
	let modified: Maybe<ZoteroAPI.Collection[]>;
	let deleted: Maybe<string[]>;

	try {
		const { data, headers, ...rest } = await zoteroClient.get<ZoteroAPI.Responses.Collections>(
			`${path}/collections`,
			{
				headers: { "Zotero-API-Key": apikey },
				params: { since }
			});
		response = { data, headers, ...rest };
		modified = data;

		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);

		if (totalResults > 100) {
			const additional = await fetchAdditionalData<ZoteroAPI.Responses.Collections>({ dataURI: `${path}/collections`, apikey, since }, totalResults);
			modified.push(...additional);
		}

		// DO NOT request deleted items since X if since = 0 (aka, initial data request)
		// It's a waste of a call
		if (since > 0 && modified.length > 0) {
			const { collections = [] } = await fetchDeleted(library, since);
			deleted = collections;

			emitCustomEvent({
				...defaultOutcome,
				data: modified,
				success: true,
				type: "collections",
				_type: "update"
			});
		}

		return {
			data: matchWithCurrentData({ modified, deleted }, match),
			lastUpdated: Number(lastUpdated)
		};
	} catch (error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch collections",
			context: {
				data: modified,
				deleted,
				error: cleanErrorIfAxios(error),
				response
			}
		});
		emitCustomEvent({
			...defaultOutcome,
			error,
			success: false,
			type: "collections",
			_type: "update"
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/[library]/deleted` endpoint of the Zotero API
 * @param library - The targeted Zotero library
 * @param since - A library version
 * @returns Elements deleted from Zotero since the specified version
 */
async function fetchDeleted(library: ZLibrary, since: number) {
	const { apikey, path } = library;

	let response: unknown;

	try {
		const { data } = await zoteroClient.get<ZoteroAPI.Responses.Deleted>(
			`${path}/deleted`,
			{
				headers: { "Zotero-API-Key": apikey },
				params: { since }
			}
		);
		response = data;

		return data;
	} catch (error) /* istanbul ignore next */ {
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
 * @param req - The parameters of the request 
 * @param config - Additional parameters
 * @param queryClient - The current React Query client
 * @returns
 */
async function fetchItems(
	req: DataRequest & { since?: number },
	{ match = [] }: { match: ZItem[] },
	queryClient: QueryClient
): Promise<QueryDataItems> {
	const { apikey, dataURI, library: { path }, since = 0 } = req;
	const paramsQuery = new URLSearchParams("");
	paramsQuery.set("since", `${since}`);
	paramsQuery.set("start", "0");
	paramsQuery.set("limit", "100");
	const defaultOutcome = {
		data: null,
		error: null,
		library: path,
		since,
		success: false
	};
	let response: unknown;
	let modified: Maybe<ZoteroAPI.Item[]>;
	let deleted: Maybe<string[]>;
	try {
		const { data, headers, ...rest } = await zoteroClient.get<ZoteroAPI.Responses.ItemsGet>(`${dataURI}?${paramsQuery.toString()}`,
			{
				headers: { "Zotero-API-Key": apikey }
			});
		response = { data, headers, ...rest };
		modified = data;
		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);
		if (totalResults > 100) {
			const additional = await fetchAdditionalData<ZoteroAPI.Responses.ItemsGet>({ dataURI, apikey, since }, totalResults);
			modified.push(...additional);
		}
		// DO NOT request deleted items since X if since = 0 (aka, initial data request)
		// It's a waste of a call
		if (since > 0) {
			// Retrieve deleted items, if any
			const { items = [] } = await fetchDeleted({ apikey, path }, since);
			deleted = items;
			const tagsQueryKey: QueryKeyTags = ["tags", { library: path }];
			const { lastUpdated: latest_tags_version } = queryClient.getQueryData<QueryDataTags>(tagsQueryKey) || {};
			if (modified.length > 0 || Number(latest_tags_version) < Number(lastUpdated)) {
				// Refetch tags data
				queryClient.refetchQueries(tagsQueryKey);
				emitCustomEvent({
					...defaultOutcome,
					data: modified,
					success: true,
					type: "items",
					_type: "update"
				});
			}
		}
		return {
			data: matchWithCurrentData({ modified, deleted }, match, { with_citekey: true }) as ZItem[],
			lastUpdated: Number(lastUpdated)
		};
	} catch (error) {
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
		emitCustomEvent({
			...defaultOutcome,
			error,
			success: false,
			type: "items",
			_type: "update"
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/keys` endpoint of the Zotero API
 * @param apikey - The targeted API key
 * @returns The API key's permissions
 */
async function fetchPermissions(apikey: string): Promise<QueryDataPermissions> {
	try {
		const { data } = await zoteroClient.get<ZoteroAPI.Responses.Permissions>(`keys/${apikey}`, { headers: { "Zotero-API-Key": apikey } });
		return data;
	} catch (error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch permissions"
		});
		return Promise.reject(error);
	}
}

/** Requests data from the `/paper` endpoint of the Semantic Scholar API
 * @param doi - The DOI of the targeted item, assumed to have already been checked and parsed.
 * @returns Citation data for the item
**/
async function fetchSemantic(doi: string): Promise<QueryDataSemantic> {
	let response: unknown;

	try {
		const apiResponse = await semanticClient.get<SemanticScholarAPI.Item>(`${doi}`);
		const { data: { citations, references } } = apiResponse;
		response = apiResponse;

		return {
			doi,
			citations: parseSemanticDOIs(citations),
			references: parseSemanticDOIs(references)
		};
	} catch (error) /* istanbul ignore next */ {
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
 * @param library - The targeted Zotero library
 * @returns The library's tags
 */
async function fetchTags(library: ZLibrary): Promise<QueryDataTags> {
	const { apikey, path } = library;

	let tags: ZoteroAPI.Tag[] = [];

	try {
		const { data, headers } = await zoteroClient.get<ZoteroAPI.Tag[]>(
			`${path}/tags?limit=100`,
			{ headers: { "Zotero-API-Key": apikey } }
		);
		tags = data;

		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);

		if (totalResults > 100) {
			const additional = await fetchAdditionalData<ZoteroAPI.Responses.Tags>({ dataURI: `${path}/tags`, apikey }, totalResults);
			tags.push(...additional);
		}

		return {
			data: makeTagList(tags),
			lastUpdated: Number(lastUpdated)
		};
	} catch (error) /* istanbul ignore next */ {
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

/** Converts Zotero tags data into a categorized list
 * @param tags - The tags data from Zotero to categorize
 * @returns The list of categorized tags
 */
function makeTagList(tags: ZoteroAPI.Tag[]): ZTagList {
	try {
		const tagMap = makeTagMap(tags);
		const zdict = makeDictionary(Array.from(tagMap.keys()));
		const zkeys = Object.keys(zdict).sort((a, b) => a < b ? -1 : 1);

		const output = {};
		zkeys.forEach(key => {
			output[key] = categorizeZoteroTags(zdict[key], tagMap);
		});
		return output;
	} catch (e) {
		throw new Error("Could not create tag list : " + e.message);
	}
}

/** Converts Zotero tags data into a Map
 * @param tags - The tags data from Zotero from which to create the Map
 * @returns A Map where each entry groups together Zotero tags with the exact same spelling, but a different type
 */
function makeTagMap(tags: ZoteroAPI.Tag[]) {
	return tags.reduce<ZTagMap>(
		(map, tag) => updateTagMap(map, tag),
		new Map()
	);
}

/** Compares two datasets and merges the changes. As the match is done on the `data.key` property, both items and collections can be matched. For items, merging involves an additional step to extract citekeys.
 * @returns The merged dataset
 */
function matchWithCurrentData<T extends { data: { key: string, extra?: string }, key: string }>(
	update: { modified?: T[], deleted?: string[] },
	arr: T[] = [],
	{ with_citekey = false } = {}
) {
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
	if (modifiedData.length == 0) {
		return oldData;
	} else if (oldData.length == 0) {
		return modifiedData;
	} else {
		const [...datastore] = oldData;
		modifiedData.forEach(item => {
			const duplicateIndex = datastore.findIndex(i => i.data.key == item.data.key);
			if (duplicateIndex == -1) {
				datastore.push(item);
			} else {
				datastore[duplicateIndex] = item;
			}
		});
		return datastore;
	}
}

/** Selects and transforms Semantic items with valid DOIs
 * @param arr - The array of Semantic items to clean
 * @returns The clean Semantic array
 */
function parseSemanticDOIs<T extends { doi: string | false | null }>(arr: T[]) {
	return arr.map(elem => {
		const { doi, ...rest } = elem;
		return {
			doi: parseDOI(doi),
			...rest
		};
	});
}

/** Adds a new entry to a tag map, if it doesn't already exist
 * @param map - The targeted tag map
 * @param tagEntry - The entry to be added
 * @returns The updated tag map
 */
function updateTagMap(map: ZTagMap, tagEntry: ZoteroAPI.Tag) {
	const { tag } = tagEntry;

	// If the map already has an entry for the tag, try to append the new entry
	if (map.has(tag)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const entry = map.get(tag)!;

		if (Array.isArray(entry)) {
			// Only append if no duplicate exists
			if (entry.every(el => !areTagsDuplicate(tagEntry, el))) {
				map.set(tag, [...entry, tagEntry]);
			}
		} else if (typeof (entry) === "object") {
			if (!areTagsDuplicate(tagEntry, entry)) {
				map.set(tag, [entry, tagEntry]);
			}
		} else {
			throw new Error(`Map entry is of unexpected type ${typeof (entry)}, expected Array or Object`);
		}
		// Else add the entry to the map
	} else {
		map.set(tag, tagEntry);
	}
	return map;
}

/** Adds or modifies items in a Zotero library. Only 50 items can be manipulated per API call.
 * @param dataList - The array containing the items' data
 * @param library - The targeted Zotero library
 * @see https://www.zotero.org/support/dev/web_api/v3/write_requests#creating_multiple_objects
 * @see https://www.zotero.org/support/dev/web_api/v3/write_requests#updating_multiple_objects
 */
function writeItems<T>(dataList: T[], library: ZLibrary) {
	const { apikey, path } = library;
	const nbCalls = Math.ceil(dataList.length / 50);
	const apiCalls: ReturnType<typeof zoteroClient.post<ZoteroAPI.Responses.ItemsWrite>>[] = [];

	for (let i = 1; i <= nbCalls; i++) {
		const itemsData = dataList.slice(50 * (i - 1), 50 * i);
		apiCalls.push(zoteroClient.post<ZoteroAPI.Responses.ItemsWrite>(
			`${path}/items`,
			JSON.stringify(itemsData),
			{ headers: { "Zotero-API-Key": apikey } }
		));
	}
	return Promise.allSettled(apiCalls);
}

export {
	areTagsDuplicate,
	cleanBibliographyHTML,
	cleanErrorIfAxios,
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
	updateTagMap,
	writeItems
};
