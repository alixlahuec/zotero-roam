import { QueryClient } from "@tanstack/react-query";
import { vi } from "vitest";
import { mock } from "vitest-mock-extended";


vi.mock("./base");
import { fetchItems } from "./base";
import { ZoteroAPI } from "./types";

import { areTagsDuplicate, extractCitekeys, makeTagList, matchWithCurrentData, updateTagMap, wrappedFetchItems } from "./helpers";

import { apiKeys, findTags, items, libraries, tags } from "Mocks";
import { DataRequest } from "Types/extension";
import { ZTagDictionary } from "Types/transforms";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary, groupLibrary } = libraries;
const { path: userPath } = userLibrary;


test("Extracting citekeys for Zotero items", () => {
	const cases = [
		{ key: "ABCD1234", data: { extra: "Citation Key: someCitekey1994" } },
		{ key: "PQRST789", data: { extra: "" } }
	];

	const expectations = [
		{ key: "someCitekey1994", data: { extra: "Citation Key: someCitekey1994" }, has_citekey: true },
		{ key: "PQRST789", data: { extra: "" }, has_citekey: false }
	];

	expect(extractCitekeys(cases)).toEqual(expectations);
	expect(extractCitekeys(items)).toEqual(items);

});

describe("Comparing tag entries", () => {
	const tag1 = { tag: "some_tag", meta: { numItems: 3, type: 0 } } as ZoteroAPI.Tag;
	const tag2 = { tag: "some_tag", meta: { numItems: 2, type: 0 } } as ZoteroAPI.Tag;
	const tag3 = { tag: "some_tag", meta: { numItems: 6, type: 1 } } as ZoteroAPI.Tag;
	const tag4 = { tag: "other_tag", meta: { numItems: 4, type: 1 } } as ZoteroAPI.Tag;

	const cases = [
		[[tag1, tag2], true],
		[[tag1, tag3], false],
		[[tag2, tag3], false],
		[[tag1, tag4], false],
		[[tag2, tag4], false],
		[[tag3, tag4], false]
	];

	test.each(cases as [[ZoteroAPI.Tag, ZoteroAPI.Tag], boolean][])(
		"Tag comparison %#",
		(tags_to_compare, are_duplicates) => {
			expect(areTagsDuplicate(...tags_to_compare)).toBe(are_duplicates);
		}
	);

	test("Inputs with incorrect format are detected", () => {
		// @ts-expect-error Test checks for bad input handling
		expect(() => areTagsDuplicate(tag1, "some_text"))
			.toThrow("Received bad input: \"some_text\", expected a Zotero tag");

		const tag_with_error = { tag: "some_tag", meta: { numItems: 4 } };
		// @ts-expect-error Test checks for bad input handling
		expect(() => areTagsDuplicate(tag1, tag_with_error))
			.toThrow(`Received bad input: ${JSON.stringify(tag_with_error)}, expected the tag to have a type`);
	});

});

describe("Building tag maps", () => {
	let tagMap = new Map();

	beforeEach(() => {
		tagMap = new Map([
			["some_tag", { tag: "some_tag", meta: { numItems: 4, type: 0 } }],
			[
				"other_tag",
				[
					{ tag: "other_tag", meta: { numItems: 3, type: 0 } },
					{ tag: "other_tag", meta: { numItems: 11, type: 1 } }
				]
			]
		]);
	});

	test("New entries are added correctly", () => {
		updateTagMap(tagMap, { tag: "a_new_tag", meta: { numItems: 2, type: 1 } } as ZoteroAPI.Tag);
		expect(tagMap.has("a_new_tag"))
			.toBe(true);
		expect(tagMap.get("a_new_tag"))
			.toEqual({ tag: "a_new_tag", meta: { numItems: 2, type: 1 } });
	});

	test("New entries are appended correctly - Object entries", () => {
		updateTagMap(tagMap, { tag: "some_tag", meta: { numItems: 4, type: 1 } } as ZoteroAPI.Tag);
		expect(tagMap.get("some_tag")).toBeInstanceOf(Array);
		expect(tagMap.get("some_tag").length).toBe(2);
		expect(tagMap.get("some_tag"))
			.toEqual([
				{ tag: "some_tag", meta: { numItems: 4, type: 0 } },
				{ tag: "some_tag", meta: { numItems: 4, type: 1 } }
			]);
	});

	test("New entries are appended correctly - Array entries", () => {
		updateTagMap(tagMap, { tag: "other_tag", meta: { numItems: 7, type: 2 } } as ZoteroAPI.Tag);
		expect(tagMap.get("other_tag").length).toBe(3);
	});

	test("Duplicates are prevented - Object entries", () => {
		updateTagMap(tagMap, { tag: "some_tag", meta: { numItems: 4, type: 0 } } as ZoteroAPI.Tag);
		expect(tagMap.get("some_tag"))
			.toEqual({ tag: "some_tag", meta: { numItems: 4, type: 0 } });
	});

	test("Duplicates are prevented - Array entries", () => {
		expect(tagMap.get("other_tag").length).toBe(2);

		updateTagMap(tagMap, { tag: "other_tag", meta: { numItems: 3, type: 0 } } as ZoteroAPI.Tag);
		expect(tagMap.get("other_tag").length).toBe(2);

		updateTagMap(tagMap, { tag: "other_tag", meta: { numItems: 11, type: 1 } } as ZoteroAPI.Tag);
		expect(tagMap.get("other_tag").length).toBe(2);
	});

	test("Badly constructed maps are detected", () => {
		const map_with_error = new Map([
			["some_tag", "some text"],
			["other_tag", "other_text"]
		]);

		// @ts-expect-error Test checks for bad input handling
		expect(() => updateTagMap(map_with_error, { tag: "some_tag", meta: { numItems: 8, type: 1 } }))
			.toThrow("Map entry is of unexpected type string, expected Array or Object");
	});
});

describe("Creating formatted tag lists", () => {
	const cases = Object.entries(libraries);

	function setExpectations(path: string, list: ZTagDictionary) {
		const output = {};
		Object.entries(list).map(([initial, tokens]) => {
			output[initial] = tokens.map(token => ({
				token,
				roam: [],
				zotero: findTags(path, token).reverse().sort((a, b) => a.tag < b.tag ? 1 : -1)
			}));
		});
		return output;
	}

	const expectations = {
		[userLibrary.path]: setExpectations(userLibrary.path, {
			"i": ["immigrant youth", "immigration"],
			"p": ["patient journeys"]
		}),
		[groupLibrary.path]: setExpectations(groupLibrary.path, {
			"h": ["housing"],
			"u": ["urban design"]
		})
	};

	test.each(cases)(
		"%# Creating tag list for %s",
		(_libName, libraryDetails) => {
			const { path } = libraryDetails;
			expect(makeTagList(tags[path])).toEqual(expectations[path]);
		}
	);
});

test("Merging data updates", () => {
	const itemsList = [
		{ data: { key: "ABC" }, key: "someCitekey" },
		{ data: { key: "DEF" }, key: "DEF" },
		{ data: { key: "GHI" }, key: "GHI" }
	];

	expect(matchWithCurrentData(
		{
			modified: [itemsList[1]],
			deleted: []
		},
		[itemsList[0]],
		{ with_citekey: false }
	))
		.toEqual([itemsList[0], itemsList[1]]);

	expect(matchWithCurrentData(
		{
			modified: [itemsList[2]],
			deleted: []
		},
		itemsList,
		{ with_citekey: false }
	))
		.toEqual(itemsList);

	expect(matchWithCurrentData(
		{
			modified: [],
			deleted: [itemsList[0].data.key]
		},
		[itemsList[0]],
		{ with_citekey: false }
	))
		.toEqual([]);

	expect(matchWithCurrentData(
		{
			modified: [itemsList[1]],
			deleted: [itemsList[2].data.key]
		},
		itemsList,
		{ with_citekey: false }
	))
		.toEqual(itemsList.slice(0, 2));
});

describe("wrappedFetchItems", () => {
	let client: QueryClient;
	const sample_req = mock<DataRequest>({
		library: {
			path: userPath
		},
		apikey: masterKey,
		dataURI: userPath + "/items"
	});
	const { apikey, library, ...identifiers } = sample_req;

	beforeEach(() => {
		client = new QueryClient();
	});

	test("Fetching items when query cache is empty", async () => {
		await wrappedFetchItems(sample_req, client);

		expect(fetchItems).toHaveBeenCalledWith({ ...sample_req, since: 0 }, { match: [] }, client);
	});

	test("Fetching items when query cache has version data", async () => {
		const cachedData = {
			data: [items[0]],
			lastUpdated: 13
		};
		client.setQueryData(
			["items", library.path, { ...identifiers }],
			(_prev) => cachedData
		);

		await wrappedFetchItems(sample_req, client);

		expect(fetchItems).toHaveBeenCalledWith({ ...sample_req, since: cachedData.lastUpdated }, { match: cachedData.data }, client);
	});
});