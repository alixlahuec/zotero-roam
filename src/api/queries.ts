import { useMemo } from "react";
import { QueryClient, UseQueryOptions, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { fetchCitoid, fetchCollections, fetchItems, fetchPermissions, fetchSemantic, fetchTags } from "./utils";

import { QueryDataCitoid, QueryDataCollections, QueryDataItems, QueryDataPermissions, QueryDataSemantic, QueryDataTags, QueryKeyCitoid, QueryKeyCollections, QueryKeyItems, QueryKeyPermissions, QueryKeySemantic, QueryKeyTags, ZLibrary } from "Types/transforms";
import { DataRequest } from "Types/extension";


/** Wrapper for retrieving items data, based on contents of the query cache. */
async function wrappedFetchItems(req: DataRequest, queryClient: QueryClient) {
	const { apikey, library: { path }, ...identifiers } = req;
	const queryKey: QueryKeyItems = ["items", path, { ...identifiers }];
	const { data: match = [], lastUpdated: since = 0 } = queryClient.getQueryData<QueryDataItems>(queryKey) || {};
	return await fetchItems({ ...req, since }, { match }, queryClient);
}

/** React Query custom hook for retrieving Wikipedia metadata for a list of URLs. By default, `cacheTime = Infinity` and `staleTime = 10min`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 *  Requests are retried only once (except for 404 errors, which should never be retried).
 */
const useQuery_Citoid = <TData = QueryDataCitoid>(
	/** The targeted URLs */
	urls: string[],
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<QueryDataCitoid, unknown, TData, QueryKeyCitoid>, "queryKey" | "queryFn"> = {}
) => {
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

/** React Query custom hook for retrieving Zotero collections. By default, `staleTime = 5 min` and `refetchInterval = 5 min`. */
const useQuery_Collections = <TData = QueryDataCollections>(
	/** The targeted Zotero libraries */
	libraries: ZLibrary[],
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<QueryDataCollections, unknown, TData, QueryKeyCollections>, "queryKey" | "queryFn"> = {}
) => {
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

/** React Query custom hook for retrieving Zotero items. By default, `staleTime = 1 min` and `refetchInterval = 1 min`. */
const useQuery_Items = <TData = QueryDataItems>(
	/** The targeted data requests */
	reqs: DataRequest[],
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<QueryDataItems, unknown, TData, QueryKeyItems>, "queryKey" | "queryFn"> = {}
) => {
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

/** React Query custom hook for retrieving permissions for Zotero API keys. By default, `staleTime = 1 hour` and `refetchInterval = 1 hour`. */
const useQuery_Permissions = <TData = QueryDataPermissions>(
	/** The targeted API keys */
	keys: string[],
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<QueryDataPermissions, unknown, TData, QueryKeyPermissions>, "queryKey" | "queryFn"> = {}
) => {
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
 */
const useQuery_Semantic = <TData = QueryDataSemantic>(
	/** The targeted DOI */
	doi: string,
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<QueryDataSemantic, unknown, TData, QueryKeySemantic>, "queryKey" | "queryFn"> = {}
) => {
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
 */
const useQuery_Tags = <TData = QueryDataTags>(
	/** The targeted Zotero libraries */
	libraries: ZLibrary[],
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<QueryDataTags, unknown, TData, QueryKeyTags>, "queryKey" | "queryFn"> = {}
) => {
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
