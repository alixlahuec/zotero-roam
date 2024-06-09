import axios from "axios";

import { Queries } from "@services/react-query";

import { CitoidAPI } from "./types";

import { cleanError } from "../../utils";


const citoidClient = axios.create({
	baseURL: "https://en.wikipedia.org/api/rest_v1/data/citation/zotero"
});


/** Requests data from the `/data/citation/zotero` endpoint of the Wikipedia API
 * @param url - The URL for which to request Zotero metadata
 * @returns The metadata for the URL
 */
async function fetchCitoid(url: string): Promise<Queries.Data.Citoid> {
	let response: unknown;
	try {
		const { data, ...rest } = await citoidClient.get<CitoidAPI.AsZotero[]>(encodeURIComponent(url));
		response = { data, ...rest };

		return {
			item: data[0],
			query: url
		};

	} catch (error) {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch metadata from Wikipedia",
			context: {
				error: cleanError(error),
				query: url,
				response
			}
		});
		return Promise.reject(error);
	}
}

export { fetchCitoid };