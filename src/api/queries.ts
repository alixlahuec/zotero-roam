import { useMemo } from "react";
import { QueryClient, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { fetchCitoid, fetchCollections, fetchItems, fetchPermissions, fetchSemantic, fetchTags } from "./utils";

import { QueryDataCollections, QueryDataItems, QueryKeyCitoid, QueryKeyCollections, QueryKeyItems, QueryKeyPermissions, QueryKeySemantic, QueryKeyTags, ZLibrary } from "Types/transforms";
import { DataRequest } from "Types/extension";


/** Wrapper for retrieving items data, based on contents of the query cache.
 * @param req - The parameters of the request
 * @param queryClient - The current React Query client
 * @returns 
 */
async function wrappedFetchItems(req: DataRequest, queryClient: QueryClient) {
	const { apikey, library: { path }, ...identifiers } = req;
	const queryKey: QueryKeyItems = ["items", path, { ...identifiers }];
	const { data: match = [], lastUpdated: since = 0 } = queryClient.getQueryData<QueryDataItems>(queryKey) || {};
	return await fetchItems({ ...req, since }, { match }, queryClient);
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

/** React Query custom hook for retrieving Zotero collections. By default, `staleTime = 5 min` and `refetchInterval = 5 min`.
 * @param libraries - The targeted Zotero libraries 
 * @param opts - Optional configuration to use with the queries 
 * @returns The React Queries for the given libraries' collections
 */
const useQuery_Collections = (libraries: ZLibrary[], opts: Record<string, any> = {}) => {
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

/** React Query custom hook for retrieving permissions for Zotero API keys. By default, `staleTime = 1 hour` and `refetchInterval = 1 hour`.
 * @param keys - The targeted Zotero API keys 
 * @param opts - Optional configuration to use with the queries 
 * @returns The React Queries for the given API keys' permissions
 */
const useQuery_Permissions = (keys: string[], opts: Record<string, any> = {}) => {
	// Defaults for this query
	const { staleTime = 1000 * 60 * 60, refetchInterval = 1000 * 60 * 60, ...rest } = opts;
	// Factory
	const queriesDefs = keys.map((apikey) => {
		const queryKey: QueryKeyPermissions = ["permissions", { apikey }];
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchPermissions(apikey),
			staleTime,
			refetchInterval,
			...rest
		};
	});
	return useQueries({
		queries: queriesDefs
	});
};

/** React Query custom hook for retrieving Semantic Scholar citation data by DOI. By default, `cacheTime = Infinity`.
 * There is no refetch scheduled, since the data should not change over the course of a session.
 * @param doi - The targeted DOI 
 * @param opts - Optional configuration to use with the queries 
 * @returns The React Query for the given DOI's Semantic Scholar data
 */
const useQuery_Semantic = (doi: string, opts: Record<string, any> = {}) => {
	// Defaults for this query
	const { cacheTime = Infinity, ...rest } = opts;
	// Factory
	const queryKey: QueryKeySemantic = ["semantic", { doi }];
	return useQuery({
		queryKey,
		queryFn: (_queryKey) => fetchSemantic(doi),
		cacheTime,
		...rest
	});
};

/** React Query custom hook for retrieving Zotero tags. By default, `staleTime = 3 min`.
 *  Refetching is managed by {@link useQuery_Items}.
 * @param libraries - The targeted Zotero libraries 
 * @param opts - Optional configuration to use with the queries 
 * @returns The React Queries for the given libraries' tags
 */
const useQuery_Tags = (libraries: ZLibrary[], opts: Record<string, any> = {}) => {
	const queriesDefs = useMemo(() => {
		// Defaults for this query
		const { staleTime = 1000 * 60 * 3, ...rest } = opts;
		// Factory
		return libraries.map((lib) => {
			const { apikey, path } = lib;
			const queryKey: QueryKeyTags = ["tags", { library: path }];
			return {
				queryKey: queryKey,
				queryFn: (_queryKey) => fetchTags({ apikey, path }),
				staleTime,
				...rest
			};
		});
	}, [libraries, opts]);

	return useQueries({
		queries: queriesDefs
	});
};

/** Custom hook for retrieving the list of Zotero libraries with `write` permissions.
 * @param libraries - The targeted Zotero libraries
 * @returns The operation's status and outcome
 */
const useWriteableLibraries = (libraries: ZLibrary[]) => {
	const apiKeys = useMemo(() => Array.from(new Set(libraries.map(lib => lib.apikey))), [libraries]);
	const permissionQueries = useQuery_Permissions(apiKeys, {
		notifyOnChangeProps: ["data", "isLoading"]
	});

	const isLoading = permissionQueries.some(q => q.isLoading);
	const permissions = useMemo(() => permissionQueries.map(q => q.data || []).flat(1), [permissionQueries]);

	const data = useMemo(() => {
		return libraries
			.filter(lib => {
				const keyData = permissions.find(k => k.key == lib.apikey);
				if (!keyData) {
					return false;
				} else {
					const { access } = keyData;
					const [libType, libId] = lib.path.split("/");
					const permissionsList = libType == "users"
						? access.user
						: (access.groups?.[libId] || access.groups?.all);
					return (permissionsList || {}).write || false;
				}
			});
	}, [libraries, permissions]);

	return {
		data,
		isLoading
	};
};

export {
	wrappedFetchItems,
	useQuery_Citoid,
	useQuery_Collections,
	useQuery_Items,
	useQuery_Permissions,
	useQuery_Semantic,
	useQuery_Tags,
	useWriteableLibraries
};
