import { QueryClient } from "@tanstack/query-core";
import axios, { AxiosResponse } from "axios";
import axiosRetry from "axios-retry";

import { emitCustomEvent } from "@services/events";
import { Queries } from "@services/react-query";

import { makeTagList, matchWithCurrentData } from "./helpers";
import { ZoteroAPI } from "./types";

import { cleanError } from "../../utils";

import { DataRequest } from "Types/extension";
import { Maybe } from "Types/helpers";
import { ZItem, ZLibrary } from "Types/transforms";


const zoteroClient = axios.create({
	baseURL: "https://api.zotero.org/",
	headers: {
		"Zotero-API-Version": 3
	}
});

axiosRetry(zoteroClient, {
	retries: 2,
	retryCondition: (error) => {
		/* istanbul ignore else */
		if (error.response) {
			const { status } = error.response;
			if (status == 429 || status >= 500) {
				return true;
			} else {
				return false;
			}
		} else {
			return true;
		}
	},
	retryDelay: (retryCount, error) => {
		/* istanbul ignore else */
		if (error.response) {
			const { headers } = error.response;
			return (Number(headers.backoff) || Number(headers["retry-after"]) || retryCount) * 1000;
		} else {
			return retryCount * 3000;
		}
	}
});


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

	const apiCalls: Promise<AxiosResponse<T>>[] = [];

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
				error: cleanError(error),
				responses,
				totalResults
			}
		});
		return Promise.reject(error);
	}
}


/** Retrieves the bibliography for a list of Zotero items. */
async function fetchBibEntries(
	/* The Zotero keys of the targeted items */
	itemKeys: string[],
	/* The targeted library */
	library: ZLibrary
): Promise<string> {
	const { apikey, path } = library;

	// * Only 100 entries can be retrieved at once
	const apiCalls: Promise<AxiosResponse<ZoteroAPI.Responses.ItemsGet<"biblatex">>>[] = [];
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
				error: cleanError(error),
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
): Promise<Queries.Data.Collections> {
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
				error: cleanError(error),
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
				error: cleanError(error),
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
): Promise<Queries.Data.Items> {
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
			const tagsQueryKey: Queries.Key.Tags = ["tags", { library: path }];
			const { lastUpdated: latest_tags_version } = queryClient.getQueryData<Queries.Data.Tags>(tagsQueryKey) || {};
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
				error: cleanError(error),
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
async function fetchPermissions(apikey: string): Promise<Queries.Data.Permissions> {
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


/** Requests data from the `/[library]/tags` endpoint of the Zotero API
 * @param library - The targeted Zotero library
 * @returns The library's tags
 */
async function fetchTags(library: ZLibrary): Promise<Queries.Data.Tags> {
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
				error: cleanError(error),
				path,
				tags
			}
		});
		return Promise.reject(error);
	}
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
	const apiCalls: Promise<AxiosResponse<ZoteroAPI.Responses.ItemsWrite>>[] = [];

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
	deleteTags,
	fetchAdditionalData,
	fetchBibEntries,
	fetchBibliography,
	fetchCollections,
	fetchDeleted,
	fetchItems,
	fetchPermissions,
	fetchTags,
	writeItems
};