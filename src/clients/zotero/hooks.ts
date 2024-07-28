import { useMemo } from "react";
import { useQueries, useQueryClient, UseQueryOptions } from "@tanstack/react-query";

import { Queries } from "@services/react-query";

import { fetchCollections, fetchPermissions, fetchTags } from "./base";
import { wrappedFetchItems } from "./helpers";

import { DataRequest } from "Types/extension";
import { ZLibrary } from "Types/transforms";


/** Use collections from one or more Zotero libraries. By default, `staleTime = 5 min` and `refetchInterval = 5 min`. */
const useCollections = <TData = Queries.Data.Collections>(
	/** The targeted Zotero libraries */
	libraries: ZLibrary[],
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<Queries.Data.Collections, unknown, TData, Queries.Key.Collections>, "queryKey" | "queryFn"> = {}
) => {
	// Defaults for this query
	const { staleTime = 1000 * 60 * 5, refetchInterval = 1000 * 60 * 5, ...rest } = opts;
	// Factory
	const client = useQueryClient();
	const queriesDefs = libraries.map((lib) => {
		const { path/*, apikey*/ } = lib;
		const queryKey: Queries.Key.Collections = ["collections", { library: path }];
		const { data: match, lastUpdated: since } = client.getQueryData<Queries.Data.Collections>(queryKey) || {};
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

/** Use Zotero items from one or more Zotero libraries. By default, `staleTime = 1 min` and `refetchInterval = 1 min`. */
const useItems = <TData = Queries.Data.Items>(
	/** The targeted data requests */
	reqs: DataRequest[],
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<Queries.Data.Items, unknown, TData, Queries.Key.Items>, "queryKey" | "queryFn"> = {}
) => {
	const client = useQueryClient();
	const queriesDefs = useMemo(() => {
		// Defaults for this query
		const { staleTime = 1000 * 60, refetchInterval = 1000 * 60, ...rest } = opts;
		// Factory
		return reqs.map((req) => {
			const { apikey, library: { path }, ...identifiers } = req;
			const queryKey: Queries.Key.Items = ["items", path, { ...identifiers }];
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

/** Use permissions for one or more Zotero API keys. By default, `staleTime = 1 hour` and `refetchInterval = 1 hour`. */
const usePermissions = <TData = Queries.Data.Permissions>(
	/** The targeted API keys */
	keys: string[],
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<Queries.Data.Permissions, unknown, TData, Queries.Key.Permissions>, "queryKey" | "queryFn"> = {}
) => {
	// Defaults for this query
	const { staleTime = 1000 * 60 * 60, refetchInterval = 1000 * 60 * 60, ...rest } = opts;
	// Factory
	const queriesDefs = keys.map((apikey) => {
		const queryKey: Queries.Key.Permissions = ["permissions", { apikey }];
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

/** Use Zotero tags from one or more libraries. By default, `staleTime = 3 min`.
 *  Refetching is managed by {@link useItems}.
 */
const useTags = <TData = Queries.Data.Tags>(
	/** The targeted Zotero libraries */
	libraries: ZLibrary[],
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<Queries.Data.Tags, unknown, TData, Queries.Key.Tags>, "queryKey" | "queryFn"> = {}
) => {
	const queriesDefs = useMemo(() => {
		// Defaults for this query
		const { staleTime = 1000 * 60 * 3, ...rest } = opts;
		// Factory
		return libraries.map((lib) => {
			const { apikey, path } = lib;
			const queryKey: Queries.Key.Tags = ["tags", { library: path }];
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
	const permissionQueries = usePermissions(apiKeys, {
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


export { useCollections, useItems, usePermissions, useTags, useWriteableLibraries };