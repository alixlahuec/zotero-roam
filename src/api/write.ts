import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTags, writeItems } from "./utils";
import { emitCustomEvent } from "../events";

import { QueryDataItems, QueryDataTags, ZLibrary } from "Types/transforms";
import { CitoidAPI, ZoteroAPI } from "Types/externals";
import { isFulfilled } from "Types/helpers";


type ImportCitoidsArgs = {
	collections: string[],
	items: CitoidAPI.AsZotero[],
	library: ZLibrary,
	tags: string[];
};

type DeleteTagsArgs = {
	library: ZLibrary,
	tags: string[]
};

type ModifyTagsArgs = {
	into: string,
	library: ZLibrary,
	tags: string[]
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

		return deleteTags(tags, { apikey, path }, version);
	}, {
		onSettled: (_data, error, variables, _context) => {
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

/** React Query custom mutation hook for adding items to Zotero
 * @fires zotero-roam:write
 * @returns 
 */
const useImportCitoids = () => {
	const client = useQueryClient();

	return useMutation((variables: ImportCitoidsArgs) => {
		const { collections = [], items, library, tags = [] } = variables;

		// Transform the data for import
		const clean_tags = tags.map(t => { return { tag: t }; });
		const dataList = items
			.map(citoid => {
				// Remove key and version from the data object
				const { key, version, ...item } = citoid;

				return {
					...item,
					collections,
					tags: clean_tags
				};
			});

		return writeItems<CitoidAPI.AsZotero>(dataList, library);
	}, {
		onSettled: (data = [], error, variables, _context) => {
			const { collections, items, library: { path }, tags } = variables;

			const outcome = data.reduce <{ successful: ZoteroAPI.Responses.ItemsWrite[], failed: string[] }> ((obj, res) => {
				/* istanbul ignore else */
				if (isFulfilled(res)) {
					obj.successful.push(res.value.data);
				} else {
					obj.failed.push(res.reason);
				}
				return obj;
			}, { successful: [], failed: [] });

			if (!error && outcome.successful.length > 0) {
				// Invalidate item queries related to the library used
				// Data can't be updated through cache modification because of the library version
				client.invalidateQueries(["items", path], {
					refetchType: "all"
				});
			}

			emitCustomEvent({
				_type: "write",
				args: {
					collections,
					items,
					tags
				},
				data: outcome,
				error,
				library: path
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
				if (isFulfilled(res)) {
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
	useDeleteTags,
	useImportCitoids,
	useModifyTags
};