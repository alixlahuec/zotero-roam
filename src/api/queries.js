import { useQueries, useQuery, useQueryClient } from "react-query";
import { fetchCitoid, fetchCollections, fetchItems, fetchPermissions, fetchSemantic, fetchTags } from "./utils";

/** Uses a React query to retrieve Wikipedia metadata for a list of URLs. By default, `cacheTime = Infinity`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 * @param {String[]} urls - The targeted URLs 
 * @param {Object} opts - Optional configuration to use with the queries
 * @returns The React query that corresponds to the URLs' Wikipedia metadata
 */
const useQuery_Citoid = (urls, opts = {}) => {
	// Defaults for this query
	let { cacheTime = Infinity, ...rest } = opts;
	// Factory
	let queriesDefs = urls.map((url) => {
		let queryKey = ["citoid", { url }];
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchCitoid(url),
			cacheTime,
			...rest
		};
	});
	return useQueries(queriesDefs);
};

/** Uses collection React queries for specific libraries. By default, `staleTime = 5 min` and `refetchInterval = 5 min`.
 * @param {ZoteroLibrary[]} libraries - The targeted Zotero libraries 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The collection React queries that correspond to the libraries
 */
const useQuery_Collections = (libraries, opts = {}) => {
	// Defaults for this query
	let { staleTime = 1000 * 60 * 5, refetchInterval = 1000 * 60 * 5, ...rest} = opts;
	// Factory
	const client = useQueryClient();
	let queriesDefs = libraries.map((lib) => {
		let { path, apikey } = lib;
		let queryKey = ["collections", { library: path, apikey }];
		let { data: match, lastUpdated: since } = client.getQueryData(queryKey) || {};
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchCollections(lib, since, { match }),
			staleTime,
			refetchInterval,
			...rest
		};
	});
	return useQueries(queriesDefs);
};

/** Uses item React queries for specific data requests. By default, `staleTime = 1 min` and `refetchInterval = 1 min`.
 * @param {{apikey: String, dataURI: String, params: String, name: String, library: String}[]} reqs - The targeted data requests
 * @param {Object} opts - Optional configuration to use with the queries
 * @returns The item React queries that correspond to the data requests
 */
const useQuery_Items = (reqs, opts = {}) => {
	// Defaults for this query
	let { staleTime = 1000 * 60, refetchInterval = 1000 * 60, ...rest} = opts;
	
	// Factory
	const client = useQueryClient();
	let queriesDefs = reqs.map((req) => {
		let { params, library, ...identifiers } = req;
		let queryKey = ["items", library,  {...identifiers}];
		let { data: match, lastUpdated: since } = client.getQueryData(queryKey) || {};
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchItems({ ...req,  since }, { match }),
			staleTime,
			refetchInterval,
			...rest
		};
	});
	return useQueries(queriesDefs);
};

/** Uses permission React queries for specific API keys. By default, `staleTime = 1 hour` and `refetchInterval = 1 hour`.
 * @param {String[]} keys - The targeted Zotero API keys 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The permission React queries that correspond to the API keys
 */
const useQuery_Permissions = (keys, opts = {}) => {
	// Defaults for this query
	let { staleTime = 1000 * 60 * 60, refetchInterval = 1000 * 60 * 60, ...rest } = opts;
	// Factory
	let queriesDefs = keys.map((apikey) => {
		let queryKey = ["permissions", { apikey }];
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchPermissions(apikey),
			staleTime,
			refetchInterval,
			...rest
		};
	});
	return useQueries(queriesDefs);
};

/** Uses a React query to retrieve Semantic Scholar citation data for a specific DOI. By default, `cacheTime = Infinity`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 * @param {String} doi - The targeted DOI 
 * @param {Object} opts - Optional configuration to use with the queries 
 * @returns The React query that correspond to the DOI's Semantic Scholar data
 */
const useQuery_Semantic = (doi, opts = {}) => {
	// Defaults for this query
	let { cacheTime = Infinity, ...rest } = opts;
	// Factory
	let queryKey = ["semantic", { doi }];
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
	let { staleTime = 1000 * 60 * 3, ...rest } = opts;
	// Factory
	let queriesDefs = libraries.map((library) => {
		let { path, apikey } = library;
		let queryKey = ["tags", { library: path, apikey }];
		return {
			queryKey: queryKey,
			queryFn: (_queryKey) => fetchTags(library),
			staleTime,
			...rest
		};
	});
	return useQueries(queriesDefs);
};

export {
	useQuery_Citoid,
	useQuery_Collections,
	useQuery_Items,
	useQuery_Permissions,
	useQuery_Semantic,
	useQuery_Tags
};
