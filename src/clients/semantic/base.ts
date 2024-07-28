import axios from "axios";
import axiosRetry from "axios-retry";

import { Queries } from "@services/react-query";

import { SemanticScholarAPI } from "./types";

import { cleanError, transformDOIs } from "../../utils";


const semanticClient = axios.create({
	baseURL: "https://api.semanticscholar.org/v1/paper/",
	params: {
		"include_unknown_references": "true"
	}
});
axiosRetry(semanticClient, {
	retries: 3
});


/** Requests data from the `/paper` endpoint of the Semantic Scholar API
 * @param doi - The DOI of the targeted item, assumed to have already been checked and parsed.
 * @returns Citation data for the item
**/
async function fetchSemantic(doi: string): Promise<Queries.Data.Semantic> {
	let response: unknown;

	try {
		const apiResponse = await semanticClient.get<SemanticScholarAPI.Item>(`${doi}`);
		const { data: { citations, references } } = apiResponse;
		response = apiResponse;

		return {
			doi,
			citations: transformDOIs(citations),
			references: transformDOIs(references)
		};
	} catch (error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch data from SemanticScholar",
			context: {
				error: cleanError(error),
				response
			}
		});
		return Promise.reject(error);
	}
}


export { fetchSemantic };