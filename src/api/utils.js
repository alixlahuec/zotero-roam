import { emitCustomEvent } from "../events";
import { cleanErrorIfAxios } from "../utils";

import { zoteroClient } from "./clients";
import { fetchDeleted } from "./deleted";
import { fetchAdditionalData, matchWithCurrentData } from "./helpers";


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
	fetchBibEntries,
	fetchBibliography,
	fetchItems,
	writeItems
};
