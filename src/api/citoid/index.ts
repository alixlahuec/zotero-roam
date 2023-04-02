import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import { AxiosError } from "axios";
import { writeItems } from "../zotero";
import { citoidClient } from "../clients";
import { emitCustomEvent } from "../../events";
import { cleanErrorIfAxios } from "../../utils";

import { CitoidAPI, ZoteroAPI } from "Types/externals";
import { ZLibrary } from "Types/transforms/zotero";


type QueryKeyCitoid = ["citoid", { url: string }];

type QueryDataCitoid = {
	item: CitoidAPI.AsZotero,
	query: string
};

type ImportCitoidsArgs = {
	collections: string[],
	items: CitoidAPI.AsZotero[],
	library: ZLibrary,
	tags: string[]
};

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

/** React Query custom hook for retrieving Wikipedia metadata for a list of URLs. By default, `cacheTime = Infinity` and `staleTime = 10min`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 *  Requests are retried only once (except for 404 errors, which should never be retried).
 * @param urls - The targeted URLs 
 * @param opts - Optional configuration to use with the queries
 * @returns The React Queries for the given URLs' Wikipedia metadata
 */
const useQuery_Citoid = (urls: string[], opts: Record<string, any> = {}) => {
	// Defaults for this query
	const {
		cacheTime = Infinity,
		retry = (failureCount: number, error: AxiosError) => {
			// TODO: fix error JSON type
			return (failureCount < 1 && (error.toJSON() as any).status != 404);
		},
		staleTime = 1000 * 60 * 10,
		...rest } = opts;
	// Factory
	const queriesDefs = urls.map((url) => {
		const queryKey: QueryKeyCitoid = ["citoid", { url }];
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchCitoid(url),
			cacheTime,
			retry,
			staleTime,
			...rest
		};
	});
	return useQueries({
		queries: queriesDefs
	});
};

/** React Query custom mutation hook for adding items to Zotero
 * @fires zotero-roam:write
 * @returns 
 */
const useImportCitoids = () => {
	const client = useQueryClient();

	return useMutation((variables: ImportCitoidsArgs) => {
		const { collections = [], items, library, tags = [] } = variables;

		// Transform the data for import
		const clean_tags = tags.map(t => { return { tag: t }; });
		const dataList = items
			.map(citoid => {
				// Remove key and version from the data object
				const { key, version, ...item } = citoid;

				return {
					...item,
					collections,
					tags: clean_tags
				};
			});

		return writeItems<CitoidAPI.AsZotero>(dataList, library);
	}, {
		onSettled: (data = [], error, variables, _context) => {
			const { collections, items, library: { path }, tags } = variables;

			const outcome = data.reduce<{ successful: ZoteroAPI.Responses.ItemsWrite[], failed: string[] }>((obj, res) => {
				/* istanbul ignore else */
				if (res.status == "fulfilled") {
					obj.successful.push(res.value.data);
				} else {
					obj.failed.push(res.reason);
				}
				return obj;
			}, { successful: [], failed: [] });

			if (!error && outcome.successful.length > 0) {
				// Invalidate item queries related to the library used
				// Data can't be updated through cache modification because of the library version
				client.invalidateQueries(["items", path], {
					refetchType: "all"
				});
			}

			emitCustomEvent({
				_type: "write",
				args: {
					collections,
					items,
					tags
				},
				data: outcome,
				error,
				library: path
			});
		}
	});
};

export {
	fetchCitoid,
	useQuery_Citoid,
	useImportCitoids
};