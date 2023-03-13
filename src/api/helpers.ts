import { QueryClient } from "@tanstack/react-query";

import { cleanErrorIfAxios } from "../utils";
import { zoteroClient } from "./clients";
import { QueryKeyItems, QueryDataItems, fetchItems } from "./zotero";

import { DataRequest } from "Types/settings";


type WithCitekeys<T> = T & { has_citekey: boolean };

/** Extracts pinned citekeys from a dataset
 * @param arr - The items to scan
 * @returns The processed dataset : each item gains a `has_citekey` property, and its `key` property is assigned its citekey 
 */
function extractCitekeys<T extends { key: string, data: { extra?: string } }>(arr: T[]): WithCitekeys<T>[] {
	const itemList = [...arr];
	return itemList.map(item => {
		let { key } = item;
		let has_citekey = false;

		if (typeof (item.data.extra) !== "undefined") {
			if (item.data.extra.includes("Citation Key: ")) {
				key = item.data.extra.match("Citation Key: (.+)")?.[1] || key;
				has_citekey = true;
			}
		}
		return {
			...item,
			key,
			has_citekey
		};
	});
}

/** Retrieves additional data from the Zotero API, when the original results are greater than the limit of n = 100.
 *  A minimum of parameters are required so that the function can be used for all data types.
 * @param req - The parameters of the request 
 * @param totalResults - The total number of results indicated by the original response 
 * @returns The additional results to the original request
 */
async function fetchAdditionalData<T>(
	req: { dataURI: string, apikey: string, since?: number },
	totalResults: number
) {
	const { dataURI, apikey, since = null } = req;
	const nbExtraCalls = Math.ceil((totalResults / 100) - 1);

	const apiCalls: ReturnType<typeof zoteroClient.get<T>>[] = [];

	for (let i = 1; i <= nbExtraCalls; i++) {
		const reqParams = new URLSearchParams("");
		if (since) {
			reqParams.set("since", `${since}`);
		}
		reqParams.set("start", `${100 * i}`);
		reqParams.set("limit", `${100}`);
		apiCalls.push(zoteroClient.get<T>(
			`${dataURI}?${reqParams.toString()}`,
			{
				headers: { "Zotero-API-Key": apikey }
			})
		);
	}

	let responses: unknown[] = [null];

	try {
		const apiResponses = await Promise.all(apiCalls);
		responses = apiResponses;

		return apiResponses.map(res => res.data).flat(1);
	} catch (error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch additional data",
			context: {
				dataURI,
				error: cleanErrorIfAxios(error),
				responses,
				totalResults
			}
		});
		return Promise.reject(error);
	}
}

/** Compares two datasets and merges the changes. As the match is done on the `data.key` property, both items and collections can be matched. For items, merging involves an additional step to extract citekeys.
 * @returns The merged dataset
 */
function matchWithCurrentData<T extends { data: { key: string, extra?: string }, key: string }>(
	update: { modified?: T[], deleted?: string[] },
	arr: T[] = [],
	{ with_citekey = false } = {}
) {
	const { modified = [], deleted = [] } = update;
	// If the data has citekeys, transform before pushing
	const modifiedData = with_citekey
		? extractCitekeys([...modified])
		: [...modified];
	const deletedData = [...deleted];

	// Remove deleted items
	const oldData = deletedData.length == 0
		? arr
		: arr.filter(item => !deletedData.includes(item.data.key));

	// Update datastore
	if (modifiedData.length == 0) {
		return oldData;
	} else if (oldData.length == 0) {
		return modifiedData;
	} else {
		const [...datastore] = oldData;
		modifiedData.forEach(item => {
			const duplicateIndex = datastore.findIndex(i => i.data.key == item.data.key);
			if (duplicateIndex == -1) {
				datastore.push(item);
			} else {
				datastore[duplicateIndex] = item;
			}
		});
		return datastore;
	}
}

export {
	extractCitekeys,
	fetchAdditionalData,
	matchWithCurrentData,
};