import { QueryClient } from "@tanstack/query-core";

import { entries, items } from "Mocks/zotero/items";
import { apiKeys } from "Mocks/zotero/keys";
import { findCollections } from "Mocks/zotero/collections";
import { libraries } from "Mocks/zotero/libraries";
import { sampleAnnot } from "Mocks/zotero/annotations";
import { sampleNote } from "Mocks/zotero/notes";
import { samplePDF } from "Mocks/zotero/pdfs";
import { tags } from "Mocks/zotero/tags";

import { _formatPDFs, _getItemCreators, _getItemTags } from "../src/public";
import { formatItemAnnotations, formatItemNotes } from "../src/utils";
import { makeTagList } from "../src/api/utils";

import ZoteroRoam from "../src/extension";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;

describe("Formatting utils", () => {
	const extension = new ZoteroRoam({
		queryClient: new QueryClient(),
		requests: {
			libraries: []
		},
		settings: {
			annotations: {},
			notes: {},
			typemap: {}
		}
	});
    
	test("Notes & Annotations formatting", () => {
		expect(extension.formatNotes([sampleNote, sampleAnnot]))
			.toEqual([
				...formatItemAnnotations([sampleAnnot]),
				...formatItemNotes([sampleNote]),
			]);
		expect(extension.formatNotes(false))
			.toEqual([]);
	});

	test("PDFs formatting", () => {
		expect(extension.formatPDFs([samplePDF], "links"))
			.toEqual(_formatPDFs([samplePDF], "links"));
		expect(extension.formatPDFs([samplePDF], "identity"))
			.toEqual(_formatPDFs([samplePDF], "identity"));
		expect(extension.formatPDFs(false))
			.toEqual([]);
	});
    
	test("Retrieving the formatted type for an item", () => {
		expect(extension.getItemType(
			{ data: { itemType: "journalArticle" } },
			{}
		)).toBe("[[journalArticle]]");

		expect(extension.getItemType(
			{ data: { itemType: "journalArticle" } },
			{ brackets: true }
		)).toBe("[[journalArticle]]");
    
		expect(extension.getItemType(
			{ data: { itemType: "bookSection" } },
			{ brackets: false }
		)).toBe("bookSection");
	});
});

describe("Retrieval utils", () => {
	let client = null;
	let extension = null;

	beforeEach(() => {
		client = new QueryClient();
		extension = new ZoteroRoam({
			queryClient: client,
			requests: {
				libraries: Object.values(libraries).map(lib => ({ apikey: masterKey, path: lib.path })),
			},
			settings: {
				annotations: {},
				notes: {},
				typemap: {}
			}
		}); 
	});

	test("Retrieving children data for an item", () => {
		const targetLibrary = Object.values(libraries).find(lib => lib.type == samplePDF.library.type && lib.id == samplePDF.library.id);
		const parentItem = items.find(it => it.data.key == samplePDF.data.parentItem);
		// getItemChildren() retrieves queries data by matching the data URI,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData(
			["items", { apikey: masterKey, dataURI: targetLibrary.path + "/items", library: targetLibrary.path }],
			(_prev) => ({
				data: [parentItem, samplePDF],
				lastUpdated: targetLibrary.version
			})
		);

		expect(extension.getItemChildren(parentItem))
			.toEqual([samplePDF]);
	});

	test("Retrieving collections data for an item", () => {
		Object.values(libraries).forEach(lib => {
			const { path, version } = lib;
			const [type, id] = path.split("/");
			const colls = findCollections(type.slice(0,-1), id, 0);

			client.setQueryData(
				["collections", { apikey: masterKey, library: path }],
				(_prev) => ({
					data: colls,
					lastUpdated: version
				})
			);
		});

		const sample_item = items.find(it => it.data.collections.length > 0);
		const collectionList = findCollections(sample_item.library.type, sample_item.library.id, 0);
		const expectedColls = sample_item.data.collections
			.map(key => collectionList.find(coll => coll.key == key).data.name);

		expect(extension.getItemCollections(sample_item, { brackets: false }))
			.toEqual(expectedColls);
		expect(extension.getItemCollections(sample_item, { brackets: true }))
			.toEqual(expectedColls.map(cl => `[[${cl}]]`));
		expect(extension.getItemCollections(sample_item, {}))
			.toEqual(expectedColls.map(cl => `[[${cl}]]`));
        
		const item_without_collections = items.find(it => it.data.collections.length == 0);
		expect(extension.getItemCollections(item_without_collections, { brackets: false }))
			.toEqual([]);

	});

	test("Retrieving creators data for an item", () => {
		const sample_item = items.find(it => it.data.creators.length > 0);
		expect(extension.getItemCreators(sample_item, {}))
			.toEqual(_getItemCreators(sample_item, {}));
	});

	test("Retrieving relations data for an item", () => {
		const semanticItem = items.find(it => it.data.key == "_SEMANTIC_ITEM_");
		const relatedItem = items.find(it => it.data.key == "PPD648N6");
		// getItems() retrieves queries data with an inclusive query,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData(
			["items"],
			(_prev) => ({
				data: items,
				lastUpdated: 9999
			})
		);

		expect(extension.getItemRelated(semanticItem, { return_as: "array", brackets: false }))
			.toEqual([relatedItem.key]);
		expect(extension.getItemRelated(semanticItem, { return_as: "raw", brackets: false }))
			.toEqual([relatedItem]);
		expect(extension.getItemRelated(semanticItem, { return_as: "string", brackets: false }))
			.toEqual(relatedItem.key);
		expect(extension.getItemRelated(semanticItem, { return_as: "string", brackets: true }))
			.toEqual(`[[@${relatedItem.key}]]`);
	});

	test("Retrieving tags data for an item", () => {
		const sample_item = items.find(it => it.data.tags.length > 0);
		expect(extension.getItemTags(sample_item, {}))
			.toEqual(_getItemTags(sample_item, {}));
	});

	test("Retrieving bibliographic entries for a list of citekeys", async() => {
		// getItems() retrieves queries data with an inclusive query,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData(
			["items"],
			(_prev) => ({
				data: items,
				lastUpdated: 9999
			})
		);

		const citekeys = Object.keys(entries);
		const expected = Object.values(entries).map(entry => entry.biblatex).join("\n");
    
		const bibs = await extension.getBibEntries(citekeys);
    
		expect(bibs)
			.toEqual(expected);
	});

	test("Retrieving all items across libraries", () => {
		// getItems() retrieves queries data with an inclusive query,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData(
			["items"],
			(_prev) => ({
				data: [...items, sampleAnnot, sampleNote, samplePDF],
				lastUpdated: 9999
			})
		);

		expect(extension.getItems())
			.toEqual([...items, sampleAnnot, sampleNote, samplePDF]);

		expect(extension.getItems("all"))
			.toEqual([...items, sampleAnnot, sampleNote, samplePDF]);
    
		expect(extension.getItems("annotations"))
			.toEqual([sampleAnnot]);
        
		expect(extension.getItems("attachments"))
			.toEqual([samplePDF]);

		expect(extension.getItems("children"))
			.toEqual([sampleAnnot, sampleNote, samplePDF]);
        
		expect(extension.getItems("items"))
			.toEqual([...items]);
        
		expect(extension.getItems("notes"))
			.toEqual([sampleNote]);

		expect(extension.getItems("pdfs"))
			.toEqual([samplePDF]);
	});

	describe("Retrieving tags data for a library", () => {
		const cases = Object.entries(libraries);

		test.each(cases)(
			"%# Retrieving tags data for %s",
			(_libName, libraryDetails) => {
				const { path, version } = libraryDetails;

				const tagList = makeTagList(tags[path]);

				client.setQueryData(
					["tags", { apikey: masterKey, library: path }],
					(_prev) => ({
						data: tagList,
						lastUpdated: version
					})
				);

				expect(extension.getTags(path))
					.toEqual(tagList);
			}
		);

	});

});