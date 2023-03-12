import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useQuery_Permissions } from "./keys";
import { fetchItems, fetchTags } from "./utils";


/** Wrapper for retrieving items data, based on contents of the query cache.
 * @param {DataRequest} req - The parameters of the request
 * @param {*} queryClient - The current React Query client
 * @returns 
 */
async function wrappedFetchItems(req, queryClient) {
	const { apikey, library: { path }, ...identifiers } = req;
	const queryKey = ["items", path, { ...identifiers }];
	const { data: match, lastUpdated: since } = queryClient.getQueryData(queryKey) || {};

	return await fetchItems({ ...req, since }, { match }, queryClient);
}

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
			const { apikey, library: { path }, ...identifiers } = req;
			const queryKey = ["items", path, { ...identifiers }];
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

/** React Query custom hook for retrieving Zotero tags. By default, `staleTime = 3 min`.
 *  Refetching is managed by {@link useQuery_Items}.
 * @param {ZLibrary[]} libraries - The targeted Zotero libraries 
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
			const queryKey = ["tags", { library: path }];
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
 * @param {ZLibrary[]} libraries - The targeted Zotero libraries
 * @returns {{data: ZLibrary[], isLoading: Boolean}} The operation's status and outcome
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
	wrappedFetchItems,
	useQuery_Items,
	useQuery_Tags,
	useWriteableLibraries
};
