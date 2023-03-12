import { areTagsDuplicate, deleteTags, fetchTags, makeDictionary, makeTagList, updateTagMap } from "./tags";

import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";
import { findTags, tags } from "Mocks/zotero/tags";
import { ZoteroTag } from "Types/externals/zotero";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { groupLibrary, userLibrary } = libraries;

describe("Comparing tag entries", () => {
	const tag1 = { tag: "some_tag", meta: { numItems: 3, type: 0 } } as ZoteroTag;
	const tag2 = { tag: "some_tag", meta: { numItems: 2, type: 0 } } as ZoteroTag;
	const tag3 = { tag: "some_tag", meta: { numItems: 6, type: 1 } } as ZoteroTag;
	const tag4 = { tag: "other_tag", meta: { numItems: 4, type: 1 } } as ZoteroTag;

	const cases = [
		[[tag1, tag2], true],
		[[tag1, tag3], false],
		[[tag2, tag3], false],
		[[tag1, tag4], false],
		[[tag2, tag4], false],
		[[tag3, tag4], false]
	];

	test.each(cases as [[ZoteroTag, ZoteroTag], boolean][])(
		"Tag comparison %#",
		(tags_to_compare, are_duplicates) => {
			expect(areTagsDuplicate(...tags_to_compare)).toBe(are_duplicates);
		}
	);

	test("Inputs with incorrect format are detected", () => {
		// @ts-expect-error
		expect(() => areTagsDuplicate(tag1, "some_text"))
			.toThrow("Received bad input: \"some_text\", expected a Zotero tag");

		const tag_with_error = { tag: "some_tag", meta: { numItems: 4 } };
		// @ts-expect-error
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
		updateTagMap(tagMap, { tag: "a_new_tag", meta: { numItems: 2, type: 2 } } as ZoteroTag);
		expect(tagMap.has("a_new_tag"))
			.toBe(true);
		expect(tagMap.get("a_new_tag"))
			.toEqual({ tag: "a_new_tag", meta: { numItems: 2, type: 1 } });
	});

	test("New entries are appended correctly - Object entries", () => {
		updateTagMap(tagMap, { tag: "some_tag", meta: { numItems: 4, type: 1 } } as ZoteroTag);
		expect(tagMap.get("some_tag")).toBeInstanceOf(Array);
		expect(tagMap.get("some_tag").length).toBe(2);
		expect(tagMap.get("some_tag"))
			.toEqual([
				{ tag: "some_tag", meta: { numItems: 4, type: 0 } },
				{ tag: "some_tag", meta: { numItems: 4, type: 1 } }
			]);
	});

	test("New entries are appended correctly - Array entries", () => {
		updateTagMap(tagMap, { tag: "other_tag", meta: { numItems: 7, type: 1 } } as ZoteroTag);
		expect(tagMap.get("other_tag").length).toBe(3);
	});

	test("Duplicates are prevented - Object entries", () => {
		updateTagMap(tagMap, { tag: "some_tag", meta: { numItems: 4, type: 0 } } as ZoteroTag);
		expect(tagMap.get("some_tag"))
			.toEqual({ tag: "some_tag", meta: { numItems: 4, type: 0 } });
	});

	test("Duplicates are prevented - Array entries", () => {
		expect(tagMap.get("other_tag").length).toBe(2);

		updateTagMap(tagMap, { tag: "other_tag", meta: { numItems: 3, type: 0 } } as ZoteroTag);
		expect(tagMap.get("other_tag").length).toBe(2);

		updateTagMap(tagMap, { tag: "other_tag", meta: { numItems: 11, type: 1 } } as ZoteroTag);
		expect(tagMap.get("other_tag").length).toBe(2);
	});

	test("Badly constructed maps are detected", () => {
		const map_with_error = new Map([
			["some_tag", "some text"],
			["other_tag", "other_text"]
		]);

		// @ts-expect-error
		expect(() => updateTagMap(map_with_error, { tag: "some_tag", meta: { numItems: 8, type: 1 } }))
			.toThrow("Map entry is of unexpected type String, expected Array or Object");
	});
});

describe("Creating a dictionary", () => {
	test("Creates dictionary from string Array", () => {
		const arr = ["amble", "bereft", "cedar", "Arbiter", "Beforehand", "Callously", "*Important*", "12th century", "🔥"];
		expect(makeDictionary(arr)).toEqual({
			"*": ["*Important*"],
			"1": ["12th century"],
			"a": ["amble", "Arbiter"],
			"b": ["bereft", "Beforehand"],
			"c": ["cedar", "Callously"],
			"\uD83D": ["🔥"]
		});
	});

	test("Bad inputs are detected", () => {
		const arr = [{ some: "prop" }];
		// @ts-expect-error
		expect(() => makeDictionary(arr))
			.toThrow("Could not add {\"some\":\"prop\"} to dictionary");
	});
});

describe("Creating formatted tag lists", () => {
	const cases = Object.entries(libraries);

	function setExpectations(path: string, list: ReturnType<typeof makeDictionary>) {
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

describe("Fetching mocked tags", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Fetching tags for %s",
		async (_libName, libraryDetails) => {
			const { path, version } = libraryDetails;
			const tagData = await fetchTags({ apikey: masterKey, path });
			expect(tagData).toEqual({
				data: makeTagList(tags[path]),
				lastUpdated: version
			});
		}
	);
});

describe("Deleting mocked tags", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Deleting tags in %s",
		async (_libName, libraryDetails) => {
			const { path, version } = libraryDetails;

			const deleteExpired = await deleteTags(["systems"], { apikey: masterKey, path }, version - 10)
				.catch((error) => {
					if (error.response) {
						return error.response;
					}
				});
			expect(deleteExpired.status).toBe(412);

			const deleteLatest = await deleteTags(["systems"], { apikey: masterKey, path }, version);
			expect(deleteLatest.status).toBe(204);
		}
	);
});
