import { Query, QueryClient, QueryFilters } from "@tanstack/query-core";

import { Queries, SelectItemCollectionsOptions, SelectItemRelatedOptions, SelectItemsOption } from "./types";

import { ZItem, ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop, ZLibrary, isZItemTop, isZAnnotation, isZAttachment, isZNote } from "Types/transforms";


/** Retrieves the collections for a given library from cache. */
function selectCollections(library: ZLibrary, { queryClient }: { queryClient: QueryClient }) {
	const { path } = library;
	const queryKey: Queries.Key.Collections = ["collections", { library: path }];
	const datastore = queryClient.getQueryData<Queries.Data.Collections>(queryKey);
	return datastore?.data || [];
}


function selectItems(
	select: "all", filters: QueryFilters, { queryClient }: { queryClient: QueryClient }
): ZItem[];
function selectItems(
	select: "annotations", filters: QueryFilters, { queryClient }: { queryClient: QueryClient }
): ZItemAnnotation[];
function selectItems(
	select: "attachments", filters: QueryFilters, { queryClient }: { queryClient: QueryClient }
): ZItemAttachment[];
function selectItems(
	select: "children", filters: QueryFilters, { queryClient }: { queryClient: QueryClient }
): (ZItemAttachment | ZItemNote | ZItemAnnotation)[];
function selectItems(
	select: "items", filters: QueryFilters, { queryClient }: { queryClient: QueryClient }
): ZItemTop[];
function selectItems(
	select: "notes", filters: QueryFilters, { queryClient }: { queryClient: QueryClient }
): (ZItemNote | ZItemAnnotation)[];
function selectItems(
	select: "pdfs", filters: QueryFilters, { queryClient }: { queryClient: QueryClient }
): ZItemAttachment[];
function selectItems(
	select: SelectItemsOption, filters: QueryFilters, { queryClient }: { queryClient: QueryClient }
): ZItem[];
/** Retrieves items from cache, with optional configuration. */
function selectItems(
	select: SelectItemsOption, filters: QueryFilters = {}, { queryClient }: { queryClient: QueryClient }
): ZItem[] {
	const items = queryClient.getQueriesData<Queries.Data.Items>({ queryKey: ["items"], ...filters })
		.map(query => {
			const [/* queryKey */, queryData] = query;
			return queryData?.data || [];
		})
		.flat(1);

	switch (select) {
		case "items":
			return items.filter(isZItemTop);
		case "attachments":
			return items.filter(isZAttachment);
		case "children":
			return items.filter(it => ["note", "annotation"].includes(it.data.itemType) || (it.data.itemType == "attachment" && it.data.contentType == "application/pdf"));
		case "annotations":
			return items.filter(isZAnnotation);
		case "notes":
			return items.filter(isZNote);
		case "pdfs":
			return items.filter(it => it.data.itemType == "attachment" && it.data.contentType == "application/pdf");
		case "all":
		default:
			return items;
	}
}


/** Retrieves an item's children from cache. */
function selectItemChildren(item: ZItemTop, { queryClient }: { queryClient: QueryClient }) {
	const location = item.library.type + "s/" + item.library.id;
	return selectItems("children", {
		predicate: (query: Query<unknown, unknown, Queries.Data.Items, Queries.Key.Items>) => {
			const { queryKey } = query;
			return queryKey[2].dataURI.startsWith(location);
		}
	}, { queryClient })
		.filter(el => el.data.parentItem == item.data.key) as (ZItemAttachment | ZItemNote | ZItemAnnotation)[];
}


/** Retrieves an item's collections from cache, and returns them in a specific format. */
function selectItemCollections(item: ZItemTop, options: SelectItemCollectionsOptions, { libraries, queryClient }: { libraries: ZLibrary[], queryClient: QueryClient }) {
	const { return_as, brackets } = options;

	const path = item.library.type + "s/" + item.library.id;
	const library = libraries.find(lib => lib.path == path)!;

	const collectionList = selectCollections(library, { queryClient });

	if (item.data.collections.length > 0) {
		const output: string[] = [];

		item.data.collections.forEach(cl => {
			const libCollection = collectionList.find(el => el.key == cl);
			if (libCollection) { output.push(libCollection.data.name); }
		});

		const collectionsList = (brackets == true)
			? output.map(cl => `[[${cl}]]`)
			: output;

		switch (return_as) {
			case "array":
				return collectionsList;
			case "string":
			default:
				return collectionsList.join(", ");
		}
	} else {
		return [];
	}
}


/** Retrieves an item's in-library relations from cache, and returns them into a specific format. */
function selectItemRelated(
	item: ZItemTop, options: SelectItemRelatedOptions, { queryClient }: { queryClient: QueryClient }
) {
	const { type: libType, id: libID } = item.library;
	const datastore = selectItems("items", {}, { queryClient })
		.filter(it => it.library.id == libID && it.library.type == libType);

	const { return_as, brackets } = options;

	if (item.data.relations && item.data.relations["dc:relation"]) {
		let relatedItems = item.data.relations["dc:relation"];
		if (typeof (relatedItems) === "string") { relatedItems = [relatedItems]; }

		const output: ZItem[] = [];
		const relRegex = /(users|groups)\/([^/]+)\/items\/(.+)/g;

		relatedItems.forEach(itemURI => {
			const [, , , itemKey] = Array.from(itemURI.matchAll(relRegex))[0];
			const libItem = datastore.find(it => it.data.key == itemKey);
			if (libItem) { output.push(libItem); }
		});

		switch (return_as) {
			case "raw":
				return output;
			case "array":
				return (brackets == true ? output.map(el => `[[@${el.key}]]`) : output.map(el => el.key));
			case "string":
			default:
				return (brackets == true ? output.map(el => `[[@${el.key}]]`) : output.map(el => el.key)).join(", ");
		}
	} else {
		switch (return_as) {
			case "raw":
			case "array":
				return [];
			case "string":
			default:
				return "";
		}
	}
}


/** Retrieves a library's tags map from cache. */
function selectTags(location: string, { libraries, queryClient }: { libraries: ZLibrary[], queryClient: QueryClient }) {
	const { path } = libraries.find(lib => lib.path == location)!;
	const queryKey: Queries.Key.Tags = ["tags", { library: path }];

	const datastore = queryClient.getQueryData<Queries.Data.Tags>(queryKey)!;
	return datastore.data;
}


export * from "./types";

export { selectCollections, selectItemChildren, selectItemCollections, selectItemRelated, selectItems, selectTags };