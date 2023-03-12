import { useQueries } from "@tanstack/react-query";
import { zoteroClient } from "./clients";
import { ZoteroPermissionsResponse } from "Types/externals/zotero";


type QueryKeyPermissions = ["permissions", { apikey: string }];

type QueryDataPermissions = ZoteroPermissionsResponse;

/** Requests data from the `/keys` endpoint of the Zotero API
 * @param apikey - The targeted API key
 * @returns The API key's permissions
 */
async function fetchPermissions(apikey: string): Promise<QueryDataPermissions> {
	try {
		const { data } = await zoteroClient.get<ZoteroPermissionsResponse>(`keys/${apikey}`, { headers: { "Zotero-API-Key": apikey } });
		return data;
	} catch (error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch permissions"
		});
		return Promise.reject(error);
	}
}

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

export {
	fetchPermissions,
	useQuery_Permissions
};