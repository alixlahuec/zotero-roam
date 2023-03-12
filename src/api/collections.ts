import { useQueries, useQueryClient } from "@tanstack/react-query";

import { emitCustomEvent } from "../events";
import { cleanErrorIfAxios } from "../utils";

import { zoteroClient } from "./clients";
import { fetchDeleted } from "./deleted";
import { fetchAdditionalData, matchWithCurrentData } from "./helpers";

import { Maybe, ZLibrary } from "Types/common";
import { ZoteroCollection } from "Types/externals/zotero";


type QueryKeyCollections = ["collections", { library: string }];

type QueryDataCollections = {
	data: ZoteroCollection[],
	lastUpdated: number
};

/** Requests data from the `/[library]/collections` endpoint of the Zotero API
 * @fires zotero-roam:update
 * @returns Collections created or modified in Zotero since the specified version
 */
async function fetchCollections(
	library: ZLibrary,
	since = 0,
	{ match = [] }: { match?: ZoteroCollection[] }
): Promise<QueryDataCollections> {
	const { apikey, path } = library;

	const defaultOutcome = {
		data: null,
		error: null,
		library: path,
		since,
		success: null,
		type: "collections"
	};

	let response: unknown;
	let modified: Maybe<ZoteroCollection[]>;
	let deleted: Maybe<string[]>;

	try {
		const { data, headers, ...rest } = await zoteroClient.get<ZoteroCollection[]>(
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
			const additional = await fetchAdditionalData<ZoteroCollection>({ dataURI: `${path}/collections`, apikey, since }, totalResults);
			modified.push(...additional);
		}

		// DO NOT request deleted items since X if since = 0 (aka, initial data request)
		// It's a waste of a call
		if (since > 0 && modified.length > 0) {
			const { collections = [] } = await fetchDeleted(library, since);
			deleted = collections;

			emitCustomEvent("update", {
				...defaultOutcome,
				data: modified,
				success: true
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
		emitCustomEvent("update", {
			...defaultOutcome,
			error,
			success: false
		});
		return Promise.reject(error);
	}
}

/** React Query custom hook for retrieving Zotero collections. By default, `staleTime = 5 min` and `refetchInterval = 5 min`.
 * @param libraries - The targeted Zotero libraries 
 * @param opts - Optional configuration to use with the queries 
 * @returns The React Queries for the given libraries' collections
 */
const useQuery_Collections = (libraries: ZLibrary[], opts: Record<string,any> = {}) => {
	// Defaults for this query
	const { staleTime = 1000 * 60 * 5, refetchInterval = 1000 * 60 * 5, ...rest } = opts;
	// Factory
	const client = useQueryClient();
	const queriesDefs = libraries.map((lib) => {
		const { path/*, apikey*/ } = lib;
		const queryKey: QueryKeyCollections = ["collections", { library: path }];
		const { data: match, lastUpdated: since } = client.getQueryData<QueryDataCollections>(queryKey) || {};
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchCollections(lib, since, { match }),
			staleTime,
			refetchInterval,
			...rest
		};
	});
	return useQueries({
		queries: queriesDefs
	});
};

export {
	fetchCollections,
	useQuery_Collections
};