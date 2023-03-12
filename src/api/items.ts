import { useMemo } from "react";
import { QueryClient, useQueries, useQueryClient } from "@tanstack/react-query";
import { emitCustomEvent } from "../events";
import { cleanErrorIfAxios } from "../utils";

import { zoteroClient } from "./clients";
import { fetchDeleted } from "./deleted";
import { fetchAdditionalData, matchWithCurrentData, wrappedFetchItems } from "./helpers";
import { QueryKeyTags, QueryDataTags } from "./tags";

import { Maybe, ZLibrary } from "Types/common";
import { ZoteroBibliography, ZoteroConfigBibliography, ZoteroItem, ZoteroItemTop, ZoteroWriteItemsResponse } from "Types/externals/zotero";
import { DataRequest } from "Types/settings";


type ZoteroItemsBiblatexResponse = ZoteroBibliography<"biblatex">[];
type ZoteroItemsBibResponse = ZoteroBibliography<"bib">;

export type QueryKeyItems = ["items", string, Omit<DataRequest, "apikey" | "library">];

export type QueryDataItems = {
	data: ZoteroItem[],
	lastUpdated: number
};

/** Retrieves the bibliography for a list of Zotero items.
 * @param itemKeys - The Zotero keys of the targeted items
 * @param library - The library of the targeted items
 * @returns The generated bibliography
 */
async function fetchBibEntries(itemKeys: string[], library: ZLibrary) {
	const { apikey, path } = library;

	// * Only 100 entries can be retrieved at once
	const apiCalls: ReturnType<typeof zoteroClient.get<ZoteroItemsBiblatexResponse>>[] = [];
	const nbCalls = Math.ceil(itemKeys.length / 100);

	for (let i = 1; i <= nbCalls; i++) {
		const keyList = itemKeys.slice(100 * (i - 1), 100 * i);
		apiCalls.push(zoteroClient.get<ZoteroItemsBiblatexResponse>(`${path}/items`, {
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
async function fetchBibliography(itemKey: string, library: ZLibrary, config: ZoteroConfigBibliography = {}) {
	const { apikey, path } = library;
	const dataURI = `${path}/items/${itemKey}`;
	// See https://www.zotero.org/support/dev/web_api/v3/basics#parameters_for_format_bib_includecontent_bib_includecontent_citation
	const { linkwrap = 0, locale = "en-US", style = "chicago-note-bibliography" } = config;

	let response: unknown;

	try {
		const { data, ...rest } = await zoteroClient.get<ZoteroItemsBibResponse>(
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

/** Requests data from the Zotero API, based on a specific data URI
 * @fires zotero-roam:update
 * @param req - The parameters of the request 
 * @param {{match?: Object[]}} config - Additional parameters
 * @param queryClient - The current React Query client
 * @returns
 */
async function fetchItems(
	req: DataRequest & { since?: number },
	{ match = [] }: { match: ZoteroItem[] },
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
		success: null,
		type: "items"
	};

	let response: unknown;
	let modified: Maybe<ZoteroItem[]>;
	let deleted: Maybe<string[]>;

	try {
		const { data, headers, ...rest } = await zoteroClient.get<ZoteroItem[]>(`${dataURI}?${paramsQuery.toString()}`,
			{
				headers: { "Zotero-API-Key": apikey }
			});
		response = { data, headers, ...rest };
		modified = data;

		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);

		if (totalResults > 100) {
			const additional = await fetchAdditionalData<ZoteroItem>({ dataURI, apikey, since }, totalResults);
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

				emitCustomEvent("update", {
					...defaultOutcome,
					data: modified,
					success: true
				});
			}
		}

		return {
			data: matchWithCurrentData({ modified, deleted }, match, { with_citekey: true }),
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
		emitCustomEvent("update", {
			...defaultOutcome,
			error,
			success: false
		});
		return Promise.reject(error);
	}
}

/** Modifies data for existing items in a Zotero library
 * @param dataList - The data array containing the modifications
 * @param library - The targeted Zotero library
 * @returns The outcome of the Axios API call
 */
function writeItems(dataList: Pick<ZoteroItemTop["data"], "key" | "version" | "tags">[], library: ZLibrary) {
	const { apikey, path } = library;
	// * Only 50 items can be added at once
	// * https://www.zotero.org/support/dev/web_api/v3/write_requests#updating_multiple_objects
	const apiCalls: ReturnType<typeof zoteroClient.post<ZoteroWriteItemsResponse>>[] = [];
	const nbCalls = Math.ceil(dataList.length / 50);

	for (let i = 1; i <= nbCalls; i++) {
		const itemsData = dataList.slice(50 * (i - 1), 50 * i);
		apiCalls.push(zoteroClient.post<ZoteroWriteItemsResponse>(
			`${path}/items`,
			JSON.stringify(itemsData),
			{ headers: { "Zotero-API-Key": apikey } }
		));
	}

	return Promise.allSettled(apiCalls);
}

/** React Query custom hook for retrieving Zotero items. By default, `staleTime = 1 min` and `refetchInterval = 1 min`.
 * @param reqs - The targeted data requests
 * @param opts - Optional configuration to use with the queries
 * @returns The React Queries for the given data requests
 */
const useQuery_Items = (reqs: DataRequest[], opts: Record<string, any> = {}) => {
	const client = useQueryClient();

	const queriesDefs = useMemo(() => {
		// Defaults for this query
		const { staleTime = 1000 * 60, refetchInterval = 1000 * 60, ...rest } = opts;

		// Factory
		return reqs.map((req) => {
			const { apikey, library: { path }, ...identifiers } = req;
			const queryKey: QueryKeyItems = ["items", path, { ...identifiers }];
			return {
				queryKey: queryKey,
				queryFn: (_queryKey) => wrappedFetchItems(req, client),
				staleTime,
				refetchInterval,
				...rest
			};
		});
	}, [reqs, client, opts]);

	return useQueries({
		queries: queriesDefs
	});
};

export {
	fetchBibEntries,
	fetchBibliography,
	fetchItems,
	writeItems,
	useQuery_Items
};
