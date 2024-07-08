import { UseQueryOptions, useQueries } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { Queries } from "@services/react-query";

import { fetchCitoid } from "./base";


/** React Query custom hook for retrieving Wikipedia metadata for a list of URLs. By default, `cacheTime = Infinity` and `staleTime = 10min`.
 *  There is no refetch scheduled, since the data should not change over the course of a session.
 *  Requests are retried only once (except for 404 errors, which should never be retried).
 */
const useCitoids = <TData = Queries.Data.Citoid>(
	/** The targeted URLs */
	urls: string[],
	/** Optional configuration for queries */
	opts: Omit<UseQueryOptions<Queries.Data.Citoid, unknown, TData, Queries.Key.Citoid>, "queryKey" | "queryFn"> = {}
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
		const queryKey: Queries.Key.Citoid = ["citoid", { url }];
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

export { useCitoids };