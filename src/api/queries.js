import { fetchCitoid, fetchCollections, fetchItems, fetchPermissions, fetchSemantic, fetchTags } from "./utils";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

/** Uses a React query to retrieve Wikipedia metadata for a list of URLs. By default, `cacheTime = Infinity` and `staleTime = 10min`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 *  Requests are retried only once (except for 404 errors, which should never be retried).
 * @param {String[]} urls - The targeted URLs 
 * @param {Object} opts - Optional configuration to use with the queries
 * @returns The React query that corresponds to the URLs' Wikipedia metadata
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

/** Uses collection React queries for specific libraries. By default, `staleTime = 5 min` and `refetchInterval = 5 min`.
 * @param {ZoteroLibrary[]} libraries - The targeted Zotero libraries 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The collection React queries that correspond to the libraries
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

/** Uses item React queries for specific data requests. By default, `staleTime = 1 min` and `refetchInterval = 1 min`.
 * @param {DataRequest[]} reqs - The targeted data requests
 * @param {Object} opts - Optional configuration to use with the queries
 * @returns The item React queries that correspond to the data requests
 */
const useQuery_Items = (reqs, opts = {}) => {
	// Defaults for this query
	const { staleTime = 1000 * 60, refetchInterval = 1000 * 60, ...rest } = opts;
	
	// Factory
	const client = useQueryClient();
	const queriesDefs = reqs.map((req) => {
		const { library: { path }, ...identifiers } = req;
		const queryKey = ["items", path,  { ...identifiers }];
		const { data: match, lastUpdated: since } = client.getQueryData(queryKey) || {};
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchItems({ ...req,  since }, { match }, client),
			staleTime,
			refetchInterval,
			...rest
		};
	});
	return useQueries({
		queries: queriesDefs
	});
};

/** Uses permission React queries for specific API keys. By default, `staleTime = 1 hour` and `refetchInterval = 1 hour`.
 * @param {String[]} keys - The targeted Zotero API keys 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The permission React queries that correspond to the API keys
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

/** Uses a React query to retrieve Semantic Scholar citation data for a specific DOI. By default, `cacheTime = Infinity`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 * @param {String} doi - The targeted DOI 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The React query that correspond to the DOI's Semantic Scholar data
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

/** Uses tag React queries for specific libraries. By default, `staleTime = 3 min`.
 *  Refetching is managed by {@link useQuery_Items}.
 * @param {ZoteroLibrary[]} libraries - The targeted Zotero libraries 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The tag React queries that correspond to the libraries
 */
const useQuery_Tags = (libraries, opts = {}) => {
	// Defaults for this query
	const { staleTime = 1000 * 60 * 3, ...rest } = opts;
	// Factory
	const queriesDefs = libraries.map((lib) => {
		const { apikey, path } = lib;
		const queryKey = ["tags", { apikey, library: path }];
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchTags({ apikey, path }),
			staleTime,
			...rest
		};
	});
	return useQueries({
		queries: queriesDefs
	});
};

const useWriteableLibraries = (libraries) => {
	const apiKeys = Array.from(new Set(libraries.map(lib => lib.apikey)));
	const permissionQueries = useQuery_Permissions(apiKeys, {
		notifyOnChangeProps: ["data", "isLoading"]
	});
	const isLoading = permissionQueries.some(q => q.isLoading);
	const permissions = permissionQueries.map(q => q.data || []).flat(1);

	const data = libraries
		.filter(lib => {
			const keyData = permissions.find(k => k.key == lib.apikey);
			if(!keyData){
				return false;
			} else {
				const { access } = keyData;
				const [libType, libId] = lib.path.split("/");
				const permissionsList = libType == "users" ? (access.user || {}) : (access.groups[libId] || access.groups.all);
				return permissionsList?.write || false;
			}
		});
	
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
