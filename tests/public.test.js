import { _getItemCreators, _getItemPublication, _getItemTags } from "../src/public";
import { items } from "Mocks/zotero/items";

describe("Retrieving creators data for an item", () => {
	const sample_item = items.find(it => it.key == "blochImplementingSocialInterventions2021");

	window.roamAlphaAPI = {
		q: jest.fn(() => [])
	};

	test("Creators' identity", () => {
		expect(_getItemCreators(sample_item, { return_as: "identity" }))
			.toEqual([
				{ name: "Gary Bloch", type: "author", inGraph: false },
				{ name: "Linda Rozmovits", type: "author", inGraph: false } 
			]);
	});

	test("Creators as names array", () => {
		expect(_getItemCreators(sample_item, { return_as: "array" }))
			.toEqual([
				"Gary Bloch",
				"Linda Rozmovits"
			]);
	});

	test("Creators as string", () => {
		expect(_getItemCreators(sample_item, {
			return_as: "string",
			brackets: true,
			use_type: true
		})).toEqual("[[Gary Bloch]], [[Linda Rozmovits]]");

		expect(_getItemCreators(sample_item, {
			return_as: "string",
			brackets: false,
			use_type: true
		})).toEqual("Gary Bloch, Linda Rozmovits");
	});
});

describe("Retrieving publication details for an item", () => {
	const cases = [
		[{ data: { publicationTitle: "some publication" } }, "some publication"],
		[{ data: { bookTitle: "some book" } }, "some book"],
		[{ data: { university: "some university" } }, "some university"],
		[{ data: {} }, ""]
	];

	test.each(cases)(
		"%# - no brackets",
		(item, expectation) => {
			expect(_getItemPublication(item, { brackets: false }))
				.toBe(expectation);
		}
	);

	test.each(cases)(
		"%# - with brackets",
		(item, expectation) => {
			expect(_getItemPublication(item))
				.toBe(expectation ? `[[${expectation}]]` : "");
		}
	);
});

test("Retrieving tags data for an item", () => {
	const sample_item = items.find(it => it.key == "pintoExploringDifferentMethods2021");

	expect(_getItemTags(sample_item, { 
		return_as: "array",
		brackets: false
	}))
		.toEqual([
			"housing"
		]);

	expect(_getItemTags(sample_item, { 
		return_as: "array",
		brackets: true
	}))
		.toEqual([
			"#[[housing]]"
		]);

	expect(_getItemTags(sample_item, {
		return_as: "string",
		brackets: false
	}))
		.toBe("housing");

	expect(_getItemTags(sample_item, {
		return_as: "string",
		brackets: true
	}))
		.toBe("#[[housing]]");
});
