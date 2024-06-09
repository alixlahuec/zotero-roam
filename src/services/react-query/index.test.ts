import { QueryClient } from "@tanstack/react-query";

import { makeTagList } from "@clients/zotero/helpers";

import { Queries, selectItemChildren, selectItemCollections, selectItemRelated, selectItems, selectTags } from ".";

import { Mocks, findCollections, items, libraries as librariesList, sampleAnnot, sampleNote, samplePDF, tags } from "Mocks";


let queryClient: QueryClient;
const libraries = Object.values(librariesList).map((lib) => ({ ...lib, apikey: "" }));

beforeEach(() => {
	queryClient = new QueryClient();
})

test("selectItemChildren", () => {
	const targetLibrary = libraries.find(lib => lib.type == samplePDF.library.type + "s" && lib.id == samplePDF.library.id)!;
	const parentItem = items.find(it => it.data.key == samplePDF.data.parentItem)!;

	// selectItemChildren() retrieves queries data by matching the data URI,
	// so no need to reproduce the exact query key
	queryClient.setQueryData<Queries.Data.Items>(
		["items", targetLibrary.path, { dataURI: targetLibrary.path + "/items" }],
		(_prev) => ({
			data: [parentItem, samplePDF],
			lastUpdated: targetLibrary.version
		})
	);

	expect(selectItemChildren(parentItem, { queryClient }))
		.toEqual([samplePDF]);
});

test("selectItemCollections", () => {
	libraries.forEach(lib => {
		const { path, version } = lib;
		const [type, id] = path.split("/");
		const colls = findCollections(type as Mocks.Library["type"], Number(id), 0);

		queryClient.setQueryData(
			["collections", { library: path }],
			(_prev) => ({
				data: colls,
				lastUpdated: version
			})
		);
	});

	const sample_item = items.find(it => it.data.collections.length > 0)!;
	const collectionList = findCollections(`${sample_item.library.type}s`, sample_item.library.id, 0);
	const expectedColls = sample_item.data.collections
		.map(key => collectionList.find(coll => coll.key == key)!.data.name);

	expect(selectItemCollections(sample_item, { return_as: "array", brackets: false }, { libraries, queryClient }))
		.toEqual(expectedColls);
	expect(selectItemCollections(sample_item, { return_as: "array", brackets: true }, { libraries, queryClient }))
		.toEqual(expectedColls.map(cl => `[[${cl}]]`));
	expect(selectItemCollections(sample_item, { return_as: "string", brackets: false }, { libraries, queryClient }))
		.toEqual(expectedColls.join(", "));
	expect(selectItemCollections(sample_item, { return_as: "string", brackets: true }, { libraries, queryClient }))
		.toEqual(expectedColls.map(cl => `[[${cl}]]`).join(", "));

	const item_without_collections = items.find(it => it.data.collections.length == 0)!;
	expect(selectItemCollections(item_without_collections, { return_as: "string", brackets: false }, { libraries, queryClient }))
		.toEqual([]);

});

test("selectItemRelated", () => {
	const semanticItem = items.find(it => it.data.key == "_SEMANTIC_ITEM_")!;
	const relatedItem = items.find(it => it.data.key == "PPD648N6")!;

	// selectItems() retrieves queries data with an inclusive query,
	// so no need to reproduce the exact query key
	queryClient.setQueryData(
		["items"],
		(_prev) => ({
			data: items,
			lastUpdated: 9999
		})
	);

	expect(selectItemRelated(semanticItem, { return_as: "array", brackets: false }, { queryClient }))
		.toEqual([relatedItem.key]);
	expect(selectItemRelated(semanticItem, { return_as: "raw", brackets: false }, { queryClient }))
		.toEqual([relatedItem]);
	expect(selectItemRelated(semanticItem, { return_as: "string", brackets: false }, { queryClient }))
		.toEqual(relatedItem.key);
	expect(selectItemRelated(semanticItem, { return_as: "string", brackets: true }, { queryClient }))
		.toEqual(`[[@${relatedItem.key}]]`);

	// No relations
	const noRelationsItem = items.find(it => JSON.stringify(it.data.relations) == "{}")!;
	expect(selectItemRelated(noRelationsItem, { return_as: "array", brackets: false }, { queryClient }))
		.toEqual([]);
	expect(selectItemRelated(noRelationsItem, { return_as: "raw", brackets: false }, { queryClient }))
		.toEqual([]);
	expect(selectItemRelated(noRelationsItem, { return_as: "string", brackets: false }, { queryClient }))
		.toEqual("");
});

test("selectItems", () => {
	// selectItems() retrieves queries data with an inclusive query,
	// so no need to reproduce the exact query key that would exist in prod
	queryClient.setQueryData(
		["items"],
		(_prev) => ({
			data: [...items, sampleAnnot, sampleNote, samplePDF],
			lastUpdated: 9999
		})
	);

	expect(selectItems("all", {}, { queryClient }))
		.toEqual([...items, sampleAnnot, sampleNote, samplePDF]);

	expect(selectItems("annotations", {}, { queryClient }))
		.toEqual([sampleAnnot]);

	expect(selectItems("attachments", {}, { queryClient }))
		.toEqual([samplePDF]);

	expect(selectItems("children", {}, { queryClient }))
		.toEqual([sampleAnnot, sampleNote, samplePDF]);

	expect(selectItems("items", {}, { queryClient }))
		.toEqual([...items]);

	expect(selectItems("notes", {}, { queryClient }))
		.toEqual([sampleNote]);

	expect(selectItems("pdfs", {}, { queryClient }))
		.toEqual([samplePDF]);
});

describe("selectTags", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Retrieving tags data for %s",
		(_libName, libraryDetails) => {
			const { path, version } = libraryDetails;

			const tagList = makeTagList(tags[path]);

			queryClient.setQueryData(
				["tags", { library: path }],
				(_prev) => ({
					data: tagList,
					lastUpdated: version
				})
			);

			expect(selectTags(path, { libraries, queryClient }))
				.toEqual(tagList);
		}
	);

});