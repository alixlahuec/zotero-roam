import { QueryClient } from "@tanstack/react-query";

import { Queries } from "@services/react-query";

import { fetchItems } from "./base";
import { ZoteroAPI } from "./types";

import { makeDictionary, searchEngine } from "../../utils";

import { DataRequest } from "Types/extension";
import { ZTagEntry, ZTagList, ZTagMap } from "Types/transforms";

/** Compares two Zotero tags based on tag string and type, to determine if they are duplicates
 * @param tag1 - The first tag to compare
 * @param tag2 - The second tag to compare
 * @returns The result of the comparison - `true` if the tags are duplicates of each other, `false` otherwise
 */
function areTagsDuplicate(tag1: ZoteroAPI.Tag, tag2: ZoteroAPI.Tag) {
	[tag1, tag2].forEach(tag => {
		if (tag.constructor !== Object || !tag.tag || !tag.meta) {
			throw new Error(`Received bad input: ${JSON.stringify(tag)}, expected a Zotero tag`);
		}
		if (tag.meta.type === undefined) {
			throw new Error(`Received bad input: ${JSON.stringify(tag)}, expected the tag to have a type`);
		}
	});

	return tag1.meta.type == tag2.meta.type && tag1.tag == tag2.tag;
}


/** Categorizes Zotero tags into tokens, based on similar spellings
 * @param z_data - The tags to be categorized, as Strings
 * @param tagMap - The map of Zotero tags
 * @returns The Array of tokenized tags, sorted alphabetically
 */
function categorizeZoteroTags(z_data: string[], tagMap: ZTagMap): ZTagEntry[] {
	const output: ZTagEntry[] = [];
	const zdata = Array.from(z_data).sort((a, b) => a > b ? -1 : 1);

	for (const elem of zdata) {
		try {
			const in_table = output.findIndex(tk => searchEngine(elem, tk.token, { any_case: true, match: "exact", search_compounds: true }));
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const z_item = tagMap.get(elem)!;
			if (in_table == -1) {
				output.push({
					token: elem.toLowerCase(),
					roam: [],
					zotero: Array.isArray(z_item) ? z_item : [z_item]
				});
			} else {
				if (Array.isArray(z_item)) {
					output[in_table].zotero.push(...z_item);
				} else {
					output[in_table].zotero.push(z_item);
				}
			}
		} catch (e) {
			throw new Error(`Failed to categorize ${elem}: ` + e.message);
		}
	}

	return output.sort((a, b) => a.token < b.token ? -1 : 1);
}


type WithHasCitekey<T> = T & { has_citekey: boolean };

/** Extracts pinned citekeys from a dataset
 * @param arr - The items to scan
 * @returns The processed dataset : each item gains a `has_citekey` property, and its `key` property is assigned its citekey 
 */
function extractCitekeys<T extends { key: string, data: { extra?: string } }>(arr: T[]): WithHasCitekey<T>[] {
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


/** Converts Zotero tags data into a categorized list
 * @param tags - The tags data from Zotero to categorize
 * @returns The list of categorized tags
 */
function makeTagList(tags: ZoteroAPI.Tag[]): ZTagList {
	try {
		const tagMap = makeTagMap(tags);
		const zdict = makeDictionary(Array.from(tagMap.keys()));
		const zkeys = Object.keys(zdict).sort((a, b) => a < b ? -1 : 1);

		const output = {};
		zkeys.forEach(key => {
			output[key] = categorizeZoteroTags(zdict[key], tagMap);
		});
		return output;
	} catch (e) {
		throw new Error("Could not create tag list : " + e.message);
	}
}


/** Converts Zotero tags data into a Map
 * @param tags - The tags data from Zotero from which to create the Map
 * @returns A Map where each entry groups together Zotero tags with the exact same spelling, but a different type
 */
function makeTagMap(tags: ZoteroAPI.Tag[]) {
	return tags.reduce<ZTagMap>(
		(map, tag) => updateTagMap(map, tag),
		new Map()
	);
}


/** Merges two datasets. As the match is done on the `data.key` property, both items and collections can be matched. For items, citekeys are extracted.
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


/** Adds a new entry to a tag map, if it doesn't already exist
 * @param map - The targeted tag map
 * @param tagEntry - The entry to be added
 * @returns The updated tag map
 */
function updateTagMap(map: ZTagMap, tagEntry: ZoteroAPI.Tag) {
	const { tag } = tagEntry;

	// If the map already has an entry for the tag, try to append the new entry
	if (map.has(tag)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const entry = map.get(tag)!;

		if (Array.isArray(entry)) {
			// Only append if no duplicate exists
			if (entry.every(el => !areTagsDuplicate(tagEntry, el))) {
				map.set(tag, [...entry, tagEntry]);
			}
		} else if (typeof (entry) === "object") {
			if (!areTagsDuplicate(tagEntry, entry)) {
				map.set(tag, [entry, tagEntry]);
			}
		} else {
			throw new Error(`Map entry is of unexpected type ${typeof (entry)}, expected Array or Object`);
		}
		// Else add the entry to the map
	} else {
		map.set(tag, tagEntry);
	}
	return map;
}


/** Wrapper for retrieving items data, based on contents of the query cache. */
async function wrappedFetchItems(req: DataRequest, queryClient: QueryClient) {
	const { apikey, library: { path }, ...identifiers } = req;
	const queryKey: Queries.Key.Items = ["items", path, { ...identifiers }];
	const { data: match = [], lastUpdated: since = 0 } = queryClient.getQueryData<Queries.Data.Items>(queryKey) || {};
	return await fetchItems({ ...req, since }, { match }, queryClient);
}


export {
	areTagsDuplicate,
	extractCitekeys,
	makeTagList,
	makeTagMap,
	matchWithCurrentData,
	updateTagMap,
	wrappedFetchItems
};
