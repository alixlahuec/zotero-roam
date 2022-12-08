import { useMemo } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCitoid, fetchCollections, fetchItems, fetchPermissions, fetchSemantic, fetchTags } from "./utils";

/** React Query custom hook for retrieving Wikipedia metadata for a list of URLs. By default, `cacheTime = Infinity` and `staleTime = 10min`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 *  Requests are retried only once (except for 404 errors, which should never be retried).
 * @param {String[]} urls - The targeted URLs 
 * @param {Object} opts - Optional configuration to use with the queries
 * @returns The React Queries for the given URLs' Wikipedia metadata
 */
const useQuery_Citoid = (urls, opts = {}) => {
	// Defaults for this query
	const { 
		cacheTime = Infinity,
		retry = (failureCount, error) => {
			return (failureCount < 1 && error.toJSON().status != 404);
		}, 
		staleTime = 1000 * 60 * 10,
		...rest } = opts;
	// Factory
	const queriesDefs = urls.map((url) => {
		const queryKey = ["citoid", { url }];
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
 * @param {ZoteroLibrary[]} libraries - The targeted Zotero libraries 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The React Queries for the given libraries' collections
 */
const useQuery_Collections = (libraries, opts = {}) => {
	// Defaults for this query
	const { staleTime = 1000 * 60 * 5, refetchInterval = 1000 * 60 * 5, ...rest } = opts;
	// Factory
	const client = useQueryClient();
	const queriesDefs = libraries.map((lib) => {
		const { path, apikey } = lib;
		const queryKey = ["collections", { library: path, apikey }];
		const { data: match, lastUpdated: since } = client.getQueryData(queryKey) || {};
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
 * @param {DataRequest[]} reqs - The targeted data requests
 * @param {Object} opts - Optional configuration to use with the queries
 * @returns The React Queries for the given data requests
 */
const useQuery_Items = (reqs, opts = {}) => {
	const client = useQueryClient();

	const queriesDefs = useMemo(() => {
		// Defaults for this query
		const { staleTime = 1000 * 60, refetchInterval = 1000 * 60, ...rest } = opts;

		// Factory
		return reqs.map((req) => {
			const { library: { path }, ...identifiers } = req;
			const queryKey = ["items", path, { ...identifiers }];
			const { data: match, lastUpdated: since } = client.getQueryData(queryKey) || {};
			return {
				queryKey: queryKey,
				queryFn: (_queryKey) => fetchItems({ ...req, since }, { match }, client),
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
 * @param {String[]} keys - The targeted Zotero API keys 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The React Queries for the given API keys' permissions
 */
const useQuery_Permissions = (keys, opts = {}) => {
	// Defaults for this query
	const { staleTime = 1000 * 60 * 60, refetchInterval = 1000 * 60 * 60, ...rest } = opts;
	// Factory
	const queriesDefs = keys.map((apikey) => {
		const queryKey = ["permissions", { apikey }];
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
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 * @param {String} doi - The targeted DOI 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The React Query for the given DOI's Semantic Scholar data
 */
const useQuery_Semantic = (doi, opts = {}) => {
	// Defaults for this query
	const { cacheTime = Infinity, ...rest } = opts;
	// Factory
	const queryKey = ["semantic", { doi }];
	return useQuery({
		queryKey,
		queryFn: (_queryKey) => fetchSemantic(doi),
		cacheTime,
		...rest
	});
};

/** React Query custom hook for retrieving Zotero tags. By default, `staleTime = 3 min`.
 *  Refetching is managed by {@link useQuery_Items}.
 * @param {ZoteroLibrary[]} libraries - The targeted Zotero libraries 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The React Queries for the given libraries' tags
 */
const useQuery_Tags = (libraries, opts = {}) => {
	const queriesDefs = useMemo(() => {
		// Defaults for this query
		const { staleTime = 1000 * 60 * 3, ...rest } = opts;
		// Factory
		return libraries.map((lib) => {
			const { apikey, path } = lib;
			const queryKey = ["tags", { apikey, library: path }];
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
 * @param {ZoteroLibrary[]} libraries - The targeted Zotero libraries
 * @returns {{data: ZoteroLibrary[], isLoading: Boolean}} The operation's status and outcome
 */
const useWriteableLibraries = (libraries) => {
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
					const permissionsList = libType == "users" ? (access.user || {}) : (access.groups[libId] || access.groups.all);
					return permissionsList?.write || false;
				}
			});
	}, [libraries, permissions]);
	
	return {
		data,
		isLoading
	};
};

export {
	useQuery_Citoid,
	useQuery_Collections,
	useQuery_Items,
	useQuery_Permissions,
	useQuery_Semantic,
	useQuery_Tags,
	useWriteableLibraries
};
