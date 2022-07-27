import { sampleAnnot } from "Mocks/zotero/annotations";
import { findCollections } from "Mocks/zotero/collections";
import { items } from "Mocks/zotero/items";
import { sampleNote } from "Mocks/zotero/notes";
import { formatNotes, getItemCreators, getItemTags, _getItemCollections, _getItemType } from "../src/public";
import { formatItemAnnotations, formatItemNotes } from "../src/utils";
import { TYPEMAP_DEFAULT } from "../src/constants";

test("Notes & Annotations formatting", () => {
	expect(formatNotes(
		[sampleNote, sampleAnnot],
		{},
		{}
	)).toEqual([
		...formatItemAnnotations([sampleAnnot]),
		...formatItemNotes([sampleNote]),
	]);
});

test("Retrieving collections data for an item", () => {
	const sample_item = items.find(it => it.data.collections.length > 0);
	const collectionList = findCollections(sample_item.library.type, sample_item.library.id, 0);
	const expectedColls = sample_item.data.collections
		.map(key => collectionList.find(coll => coll.key == key).data.name);

	expect(_getItemCollections(sample_item, collectionList, { brackets: false }))
		.toEqual(expectedColls);
});

describe("Retrieving creators data for an item", () => {
	const sample_item = items.find(it => it.key == "blochImplementingSocialInterventions2021");

	window.roamAlphaAPI = {
		q: jest.fn(() => [])
	};

	test("Creators' identity", () => {
		expect(getItemCreators(sample_item, { return_as: "identity" }))
			.toEqual([
				{ name: "Gary Bloch", type: "author", inGraph: false },
				{ name: "Linda Rozmovits", type: "author", inGraph: false } 
			]);
	});

	test("Creators as names array", () => {
		expect(getItemCreators(sample_item, { return_as: "array" }))
			.toEqual([
				"Gary Bloch",
				"Linda Rozmovits"
			]);
	});

	test("Creators as string", () => {
		expect(getItemCreators(sample_item, {
			return_as: "string",
			brackets: true,
			use_type: true
		})).toEqual([
			"[[Gary Bloch]]",
			"[[Linda Rozmovits]]"
		]);

		expect(getItemCreators(sample_item, {
			return_as: "string",
			brackets: false,
			use_type: true
		})).toEqual([
			"Gary Bloch",
			"Linda Rozmovits"
		]);
	});
});

test("Retrieving tags data for an item", () => {
	const sample_item = items.find(it => it.key == "pintoExploringDifferentMethods2021");

	expect(getItemTags(sample_item, { 
		return_as: "array",
		brackets: false
	}))
		.toEqual([
			"housing"
		]);

	expect(getItemTags(sample_item, { 
		return_as: "array",
		brackets: true
	}))
		.toEqual([
			"#[[housing]]"
		]);

	expect(getItemTags(sample_item, {
		return_as: "string",
		brackets: false
	}))
		.toBe("housing");

	expect(getItemTags(sample_item, {
		return_as: "string",
		brackets: true
	}))
		.toBe("#[[housing]]");
});

test("Retrieving the formatted type for an item", () => {
	expect(_getItemType(
		{ data: { itemType: "journalArticle" }},
		TYPEMAP_DEFAULT,
		{ brackets: true }
	)).toBe("[[Article]]");

	expect(_getItemType(
		{ data: { itemType: "bookSection" }},
		TYPEMAP_DEFAULT,
		{ brackets: false }
	)).toBe("Chapter");
});