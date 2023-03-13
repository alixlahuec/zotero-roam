import { useQuery } from "@tanstack/react-query";
import { cleanErrorIfAxios, parseDOI } from "../../utils";
import { semanticClient } from "../clients";

import { SemanticScholarItem, SemanticScholarRelatedEntry } from "Types/externals/semantic";


type QueryKeySemantic = ["semantic", { doi: string }];

type QueryDataSemantic = {
	doi: string,
	citations: ReturnType<typeof parseSemanticDOIs<SemanticScholarRelatedEntry>>,
	references: ReturnType<typeof parseSemanticDOIs<SemanticScholarRelatedEntry>>
};

/** Requests data from the `/paper` endpoint of the Semantic Scholar API
 * @param doi - The DOI of the targeted item, assumed to have already been checked and parsed.
 * @returns {Promise<{doi: String, citations: Object[], references: Object[]}>} Citation data for the item
**/
async function fetchSemantic(doi: string): Promise<QueryDataSemantic> {
	let response: unknown;

	try {
		const apiResponse = await semanticClient.get<SemanticScholarItem>(`${doi}`);
		const { data: { citations, references } } = apiResponse;
		response = apiResponse;

		return {
			doi,
			citations: parseSemanticDOIs(citations),
			references: parseSemanticDOIs(references)
		};
	} catch (error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch data from SemanticScholar",
			context: {
				error: cleanErrorIfAxios(error),
				response
			}
		});
		return Promise.reject(error);
	}
}

/** React Query custom hook for retrieving Semantic Scholar citation data by DOI. By default, `cacheTime = Infinity`.
 * There is no refetch scheduled, since the data should not change over the course of a session.
 * @param doi - The targeted DOI 
 * @param opts - Optional configuration to use with the queries 
 * @returns The React Query for the given DOI's Semantic Scholar data
 */
const useQuery_Semantic = (doi: string, opts: Record<string,any> = {}) => {
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

/** Selects and transforms Semantic items with valid DOIs
 * @param {Object[]} arr - The array of Semantic items to clean
 * @returns The clean Semantic array
 */
function parseSemanticDOIs<T extends { doi: string | false | null }>(arr: T[]) {
	return arr.map(elem => {
		const { doi, ...rest } = elem;
		return {
			doi: parseDOI(doi),
			...rest
		};
	});
}

export {
	fetchSemantic,
	useQuery_Semantic,
	parseSemanticDOIs
};