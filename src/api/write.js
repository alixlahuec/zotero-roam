import { useMutation, useQueryClient } from "@tanstack/react-query";
import { emitCustomEvent } from "../events";

import { writeCitoids } from "./citoid";
import { deleteTags } from "./tags";
import { writeItems } from "./utils";


/** React Query custom mutation hook for deleting tags from a Zotero library.
 * @fires zotero-roam:write
 * @returns 
 */
const useDeleteTags = () => {
	const client = useQueryClient();

	return useMutation((variables) => {
		const { library: { apikey, path }, tags } = variables;
		const { lastUpdated: version } = client.getQueryData(["tags", { library: path }]);

		return deleteTags(tags, { apikey, path }, version);
	}, {
		onSettled: (data, error, variables, _context) => {
			const { library: { path }, tags } = variables;

			if(!error){
				// Invalidate item queries related to the library used
				// Data can't be updated through cache modification because of the library version
				client.invalidateQueries([ "items", path ], {
					refetchType: "all"
				}, {
					throwOnError: true
				});
			}

			emitCustomEvent("tags-deleted", {
				data,
				error,
				library: path,
				tags
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

	return useMutation((variables) => {
		const { collections = [], items, library, tags = [] } = variables;
		return writeCitoids(items, { library, collections, tags });
	}, {
		onSettled: (data, error, variables, _context) => {
			const { collections, items, library: { path }, tags } = variables;

			const outcome = data.reduce((obj, res) => {
				/* istanbul ignore else */
				if(res.status == "fulfilled"){
					obj.successful.push(res.value);
				} else {
					obj.failed.push(res.reason);
				}
				return obj;
			},{ successful: [], failed: [] });

			if(!error && outcome.successful.length > 0){
				// Invalidate item queries related to the library used
				// Data can't be updated through cache modification because of the library version
				client.invalidateQueries([ "items", path ], {
					refetchType: "all"
				});
			}

			emitCustomEvent("write", {
				args: {
					collections,
					items,
					tags
				},
				data: outcome,
				error,
				library: path,
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

	return useMutation((variables) => {
		const { into, library: { apikey, path }, tags } = variables;
		const dataList = [];
		const libItems = client.getQueriesData(["items", path])
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

		return writeItems(dataList, { apikey, path });
	}, {
		onSettled: (data, error, variables, _context) => {
			const { into, library: { path }, tags } = variables;

			const outcome = data.reduce((obj, res) => {
				/* istanbul ignore else */
				if(res.status == "fulfilled"){
					obj.successful.push(res.value);
				} else {
					obj.failed.push(res.reason);
				}
				return obj;
			},{ successful: [], failed: [] });

			/* istanbul ignore if */
			if(outcome.successful.length > 0){
				// If any item was modified, invalidate item queries for the targeted library
				// Data can't be updated through cache modification because of the library version
				client.invalidateQueries([ "items", path ], {
					refetchType: "all"
				});
			}

			emitCustomEvent("tags-modified", {
				args: {
					into,
					tags
				},
				data: outcome,
				error,
				library: path
			});
		}
	});
};

export {
	useDeleteTags,
	useImportCitoids,
	useModifyTags
};