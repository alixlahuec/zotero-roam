import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import { Queries } from "@services/react-query";

import { fetchSemantic } from "./base";


/** Use Semantic Scholar citation data for a DOI. By default, `cacheTime = Infinity`.
 * There is no refetch scheduled, since the data should not change over the course of a session.
 * @param doi - The targeted DOI 
 * @param opts - Optional configuration to use with the queries 
 * @returns The React Query for the given DOI's Semantic Scholar data
 */
const useSemantic = <TData = Queries.Data.Semantic>(
	/** The targeted DOI */
	doi: string,
	/** Optional configuration to use with the queries */
	opts: Omit<UseQueryOptions<Queries.Data.Semantic, Error, TData, Queries.Key.Semantic>, "queryKey" | "queryFn"> = {}
) => {
	// Defaults for this query
	const { cacheTime = Infinity, ...rest } = opts;
	// Factory
	const queryKey: Queries.Key.Semantic = ["semantic", { doi }];
	return useQuery({
		queryKey,
		queryFn: (_queryKey) => fetchSemantic(doi),
		cacheTime,
		...rest
	});
};


export { useSemantic };