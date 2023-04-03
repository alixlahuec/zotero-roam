import { useMemo } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { emitCustomEvent } from "../../events";
import { cleanErrorIfAxios, searchEngine } from "../../utils";

import { zoteroClient } from "../clients";
import { fetchAdditionalData } from "../helpers";
import { writeItems, QueryDataItems } from "./items";
import * as __thisModule from "./tags";

import { ZoteroAPI } from "Types/externals";
import { ZLibrary } from "Types/transforms/zotero";



type RoamPage = { title: string, uid: string }

type TagMap = Map<string, (ZoteroAPI.Tag | ZoteroAPI.Tag[])>

type TagEntry = {
	token: string,
	roam: RoamPage[],
	zotero: ZoteroAPI.Tag[]
}

type TagDictionary = Record<string, string[]>;

type TagList = Record<string, TagEntry[]>;

export type QueryKeyTags = ["tags", { library: string }];

export type QueryDataTags = {
	data: TagList,
	lastUpdated: number
}

export type DeleteTagsArgs = {
	library: ZLibrary,
	tags: string[]
};

export type ModifyTagsArgs = {
	into: string,
	library: ZLibrary,
	tags: string[]
};

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
function categorizeZoteroTags(z_data: string[], tagMap: TagMap): TagEntry[] {
	const output: TagEntry[] = [];
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

/** Deletes Zotero tags through the `/[library]/tags` endpoint of the Zotero API
 * @param tags - The names of the tags to be deleted
 * @param library - The targeted Zotero library
 * @param version - The last known version of the Zotero library
 * @returns The outcome of the Axios API call
 */
async function deleteTags(tags: string[], library: ZLibrary, version: number) {
	const { apikey, path } = library;
	// * Only 50 tags can be deleted at once
	// * Since each deletion is version-dependent, the extension won't support deleting more for now
	// https://www.zotero.org/support/dev/web_api/v3/write_requests#deleting_multiple_tags
	/* istanbul ignore if */
	if (tags.length > 50) {
		window.zoteroRoam?.warn?.({
			origin: "API",
			message: "API limits exceeded",
			detail: "Only 50 Zotero tags can be deleted at once. Any additional tags selected will be ignored."
		});
	}

	const tagList = tags.slice(0, 50).map(t => encodeURIComponent(t)).join(" || ");

	return await zoteroClient.delete<ZoteroAPI.Responses.TagsDelete>(
		`${path}/tags`,
		{
			headers: {
				"Zotero-API-Key": apikey,
				"If-Unmodified-Since-Version": version
			},
			params: {
				tag: tagList
			}
		}
	);
}

/** Requests data from the `/[library]/tags` endpoint of the Zotero API
 * @param library - The targeted Zotero library
 * @returns The library's tags
 */
async function fetchTags(library: ZLibrary): Promise<QueryDataTags> {
	const { apikey, path } = library;

	let tags: ZoteroAPI.Tag[] = [];

	try {
		const { data, headers } = await zoteroClient.get<ZoteroAPI.Tag[]>(
			`${path}/tags?limit=100`,
			{ headers: { "Zotero-API-Key": apikey } }
		);
		tags = data;

		const { "last-modified-version": lastUpdated, "total-results": totalResultsStr } = headers;
		const totalResults = Number(totalResultsStr);

		if (totalResults > 100) {
			const additional = await fetchAdditionalData<ZoteroAPI.Responses.Tags>({ dataURI: `${path}/tags`, apikey }, totalResults);
			tags.push(...additional);
		}

		return {
			data: makeTagList(tags),
			lastUpdated: Number(lastUpdated)
		};
	} catch (error) /* istanbul ignore next */ {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Failed to fetch tags",
			context: {
				error: cleanErrorIfAxios(error),
				path,
				tags
			}
		});
		return Promise.reject(error);
	}
}

/** Creates a dictionary from a String Array
 * @param arr - The array from which to make the dictionary
 * @returns An object where each entry is made up of a key (String ; a given letter or character, in lowercase) and the strings from the original array that begin with that letter or character (in any case).
 */
function makeDictionary(arr: string[]): TagDictionary {
	return arr.reduce((dict, elem) => {
		try {
			const initial = elem.charAt(0).toLowerCase();
			if (dict[initial]) {
				dict[initial].push(elem);
			} else {
				dict[initial] = [elem];
			}
		} catch (e) {
			throw new Error(`Could not add ${JSON.stringify(elem)} to dictionary`);
		}
		return dict;
	}, {});
}

/** Converts Zotero tags data into a categorized list
 * @param {ZoteroAPI.Tag[]} tags - The tags data from Zotero to categorize
 * @returns {Object.<string, TagEntry[]>} The list of categorized tags
 */
function makeTagList(tags: ZoteroAPI.Tag[]): TagList {
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
	return tags.reduce<TagMap>(
		(map, tag) => updateTagMap(map, tag),
		new Map()
	);
}

/** Adds a new entry to a tag map, if it doesn't already exist
 * @param map - The targeted tag map
 * @param tagEntry - The entry to be added
 * @returns The updated tag map
 */
function updateTagMap(map: TagMap, tagEntry: ZoteroAPI.Tag) {
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
		} else if (typeof(entry) === "object") {
			if (!areTagsDuplicate(tagEntry, entry)) {
				map.set(tag, [entry, tagEntry]);
			}
		} else {
			throw new Error(`Map entry is of unexpected type ${typeof(entry)}, expected Array or Object`);
		}
		// Else add the entry to the map
	} else {
		map.set(tag, tagEntry);
	}
	return map;
}

/** React Query custom hook for retrieving Zotero tags. By default, `staleTime = 3 min`.
 *  Refetching is managed by {@link useQuery_Items}.
 * @param libraries - The targeted Zotero libraries 
 * @param opts - Optional configuration to use with the queries 
 * @returns The React Queries for the given libraries' tags
 */
const useQuery_Tags = (libraries: ZLibrary[], opts: Record<string, any> = {}) => {
	const queriesDefs = useMemo(() => {
		// Defaults for this query
		const { staleTime = 1000 * 60 * 3, ...rest } = opts;
		// Factory
		return libraries.map((lib) => {
			const { apikey, path } = lib;
			const queryKey: QueryKeyTags = ["tags", { library: path }];
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

/** React Query custom mutation hook for deleting tags from a Zotero library.
 * @fires zotero-roam:write
 * @returns 
 */
const useDeleteTags = () => {
	const client = useQueryClient();

	return useMutation((variables: DeleteTagsArgs) => {
		const { library: { apikey, path }, tags } = variables;
		const { lastUpdated: version = 0 } = client.getQueryData<QueryDataTags>(["tags", { library: path }]) || {};

		return __thisModule.deleteTags(tags, { apikey, path }, version);
	}, {
		onSettled: (data, error, variables, _context) => {
			const { library: { path }, tags } = variables;

			if (!error) {
				// Invalidate item queries related to the library used
				// Data can't be updated through cache modification because of the library version
				client.invalidateQueries(["items", path], {
					refetchType: "all"
				}, {
					throwOnError: true
				});
			}

			emitCustomEvent({
				args: {
					tags
				},
				error,
				library: path,
				_type: "tags-deleted"
			});
		}
	});
};

/** React Query custom mutation hook for modifying tags in a Zotero library
 * @fires zotero-roam:tags-modified
 * @returns
 */
const useModifyTags = () => {
	const client = useQueryClient();

	return useMutation((variables: ModifyTagsArgs) => {
		const { into, library: { apikey, path }, tags } = variables;
		const dataList: Pick<ZoteroAPI.ItemTop["data"], "key" | "version" | "tags">[] = [];
		const libItems = client.getQueriesData<QueryDataItems>(["items", path])
			.map(query => (query[1] || {}).data || []).flat(1)
			.filter(i => !["attachment", "note", "annotation"].includes(i.data.itemType) && i.data.tags.length > 0);

		libItems.forEach(i => {
			const itemTags = i.data.tags;
			// If the item already has the target tag, with type 0 (explicit or implicit) - remove it from the array before the filtering :
			const has_clean_tag = itemTags.findIndex(it => it.tag == into && (it.type == 0 || !it.type));
			if (has_clean_tag > -1) {
				itemTags.splice(has_clean_tag, 1);
			}
			// Compare the lengths of the tag arrays, before vs. after filtering out the tags to be renamed
			const cleanTags = itemTags.filter(t => !tags.includes(t.tag));
			if (cleanTags.length < itemTags.length) {
				// If they do not match (aka, there are tags to be removed/renamed), insert the target tag & add to the dataList
				cleanTags.push({ tag: into, type: 0 });
				dataList.push({
					key: i.data.key,
					version: i.version,
					tags: cleanTags
				});
			}
		});

		return writeItems<Pick<ZoteroAPI.ItemTop["data"], "key" | "version" | "tags">>(dataList, { apikey, path });
	}, {
		onSettled: (data = [], error, variables, _context) => {
			const { into, library: { path }, tags } = variables;

			const outcome = data.reduce<{ successful: ZoteroAPI.Responses.ItemsWrite[], failed: string[] }>((obj, res) => {
				/* istanbul ignore else */
				if (res.status == "fulfilled") {
					obj.successful.push(res.value.data);
				} else {
					obj.failed.push(res.reason);
				}
				return obj;
			}, { successful: [], failed: [] });

			/* istanbul ignore if */
			if (outcome.successful.length > 0) {
				// If any item was modified, invalidate item queries for the targeted library
				// Data can't be updated through cache modification because of the library version
				client.invalidateQueries(["items", path], {
					refetchType: "all"
				});
			}

			emitCustomEvent({
				args: {
					into,
					tags
				},
				data: outcome,
				error,
				library: path,
				_type: "tags-modified"
			});
		}
	});
};

export {
	areTagsDuplicate,
	deleteTags,
	fetchTags,
	makeDictionary,
	makeTagList,
	updateTagMap,
	useQuery_Tags,
	useDeleteTags,
	useModifyTags
};