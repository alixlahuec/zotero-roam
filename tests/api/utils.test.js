import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

import { areTagsDuplicate, deleteTags, fetchBibEntries, fetchBibliography, fetchItems, fetchPermissions, fetchTags, makeDictionary, makeTagList, updateTagMap, writeItems } from "../../src/api/utils";

import { bibs, findBibliographyEntry } from "Mocks/zotero/bib";
import { findBibEntry, findItems } from "Mocks/zotero/items";
import { findTags, tags } from "Mocks/zotero/tags";
import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary, groupLibrary } = libraries;
const getLibraryPath = (library) => {
	return library.type + "s/" + library.id;
};

describe("Comparing tag entries", () => {
	const tag1 = { tag: "some_tag", meta: { numItems: 3, type: 0 } };
	const tag2 = { tag: "some_tag", meta: { numItems: 2, type: 0 } };
	const tag3 = { tag: "some_tag", meta: { numItems: 6, type: 1 } };
	const tag4 = { tag: "other_tag", meta: { numItems: 4, type: 1 } };

	const cases = [
		[[tag1, tag2], true],
		[[tag1, tag3], false],
		[[tag2, tag3], false],
		[[tag1, tag4], false],
		[[tag2, tag4], false],
		[[tag3, tag4], false]
	];

	test.each(cases)(
		"Tag comparison %#",
		(tags_to_compare, are_duplicates) => {
			expect(areTagsDuplicate(...tags_to_compare)).toBe(are_duplicates);
		}
	);

	test("Inputs with incorrect format are detected", () => {
		expect(() => areTagsDuplicate(tag1, "some_text"))
			.toThrow("Received bad input: \"some_text\", expected a Zotero tag");
		
		const tag_with_error = { tag: "some_tag", meta: { numItems: 4 } };
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
		updateTagMap(tagMap, { tag: "a_new_tag", meta: { numItems: 2, type: 1 } });
		expect(tagMap.has("a_new_tag"))
			.toBe(true);
		expect(tagMap.get("a_new_tag"))
			.toEqual({ tag: "a_new_tag", meta: { numItems: 2, type: 1 } });
	});

	test("New entries are appended correctly - Object entries", () => {
		updateTagMap(tagMap, { tag: "some_tag", meta: { numItems: 4, type: 1 } });
		expect(tagMap.get("some_tag")).toBeInstanceOf(Array);
		expect(tagMap.get("some_tag").length).toBe(2);
		expect(tagMap.get("some_tag"))
			.toEqual([
				{ tag: "some_tag", meta: { numItems: 4, type: 0 } },
				{ tag: "some_tag", meta: { numItems: 4, type: 1 } }
			]);
	});

	test("New entries are appended correctly - Array entries", () => {
		updateTagMap(tagMap, { tag: "other_tag", meta: { numItems: 7, type: 2 } });
		expect(tagMap.get("other_tag").length).toBe(3);
	});

	test("Duplicates are prevented - Object entries", () => {
		updateTagMap(tagMap, { tag: "some_tag", meta: { numItems: 4, type: 0 } });
		expect(tagMap.get("some_tag"))
			.toEqual({ tag: "some_tag", meta: { numItems: 4, type: 0 } });
	});

	test("Duplicates are prevented - Array entries", () => {
		expect(tagMap.get("other_tag").length).toBe(2);

		updateTagMap(tagMap, { tag: "other_tag", meta: { numItems: 3, type: 0 } });
		expect(tagMap.get("other_tag").length).toBe(2);

		updateTagMap(tagMap, { tag: "other_tag", meta: { numItems: 11, type: 1 } });
		expect(tagMap.get("other_tag").length).toBe(2);
	});

	test("Badly constructed maps are detected", () => {
		const map_with_error = new Map([
			["some_tag", "some text"],
			["other_tag", { tag: "other_tag", meta: { numItems: 3, type: 0 } }]
		]);

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
		expect(() => makeDictionary(arr))
			.toThrow("Could not add {\"some\":\"prop\"} to dictionary");
	});
});

describe("Creating formatted tag lists", () => {
	const cases = Object.entries(libraries);

	function setExpectations(path, list){
		const output = {};
		Object.entries(list).map(([initial, tokens]) => {
			output[initial] = tokens.map(token => ({
				token,
				roam: [],
				zotero: findTags(path, token).reverse().sort((a,b) => a.tag < b.tag ? 1 : -1)
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

describe("Fetching mocked API Key permissions", () => {
	const cases = Object.entries(apiKeys);
	test.each(cases)(
		"%# Fetching permissions for %s", 
		async(_keyName, expectation) => {
			const permissions = await fetchPermissions(expectation.key);
			expect(permissions).toEqual(expectation);
		}
	);
});

describe("Fetching mocked bibliography", () => {
	const cases = Object.entries(bibs);
	test.each(cases)(
		"%# Fetching bibliography as bib for %s",
		async(_bibName, entry) => {
			const path = getLibraryPath(entry.library);

			const bibliography = await fetchBibliography(entry.key, { apikey: masterKey, path }, {});
			const { bib } = findBibliographyEntry({ key: entry.key, path });

			expect(bibliography).toEqual(bib);
		}
	);
});

describe("Fetching mocked bibliography entries", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Fetching a bibliography entry from %s",
		async(_libName, libraryDetails) => {
			const { type, id, path } = libraryDetails;
			const sample_item = findItems({ type, id, since: 0 })[0];

			const res = await fetchBibEntries([sample_item.data.key], { apikey: masterKey, path });

			const sample_bib = findBibEntry({ type, id, key: sample_item.data.key });

			expect(res).toBe(sample_bib.biblatex);
		}
	);
});

describe("Fetching mocked items", () => {
	const cases = Object.entries(libraries);
	const queryClient = new QueryClient();

	test.each(cases)(
		"%# Fetching items for %s",
		async(_libName, libraryDetails) => {
			const { type, id, path, version } = libraryDetails;
			
			const itemData = findItems({ type, id, since: 0 });

			const sinceEver = await fetchItems(
				{ apikey: masterKey, dataURI: `${path}/items`, library: libraryDetails, since: 0 },
				{ match: [] },
				queryClient
			);
			expect(sinceEver).toEqual({
				data: itemData,
				lastUpdated: version
			});

			const sinceLatest = await fetchItems(
				{ apikey: masterKey, dataURI: `${path}/items`, library: libraryDetails, since: version },
				{ match: itemData },
				queryClient
			);
			expect(sinceLatest).toEqual({
				data: itemData,
				lastUpdated: version
			});
		}
	);
});

describe("Updating mocked items", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Updating an item from %s",
		async(_libName, libraryDetails) => {
			const { type, id, path } = libraryDetails;
			const sample_item = findItems({ type, id, since: 0 })[0];

			const res = await writeItems(
				[{ key: sample_item.data.key, version: sample_item.version, tags: [{ tag: "TEST_TAG", type: 0 }] }],
				{ apikey: masterKey, path });

			const data = res.map(rq => rq.value.data);
            
			expect(data).toEqual([{
				failed: {},
				unchanged: {},
				success: {
					0: sample_item.data.key
				},
				successful: {
					0: {
						...sample_item,
						data: {
							tags: [{ tag: "TEST_TAG", type: 0 }]
						}
					}
				}
			}]);

			const resWithFailure = await writeItems(
				[{ key: sample_item.data.key, version: sample_item.version - 1, tags: [{ tag: "TEST_TAG", type: 0 }] }],
				{ apikey: masterKey, path });

			const dataWithFailure = resWithFailure.map(rq => rq.value.data);

			expect(dataWithFailure).toEqual([{
				failed: {
					0: sample_item.data.key
				},
				unchanged: {
					0: sample_item
				},
				success: {},
				successful: {}
			}]);
		}
	);
});

describe("Fetching mocked tags", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Fetching tags for %s",
		async(_libName, libraryDetails) => {
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
		async(_libName, libraryDetails) => {
			const { path, version } = libraryDetails;
            
			const deleteExpired = await deleteTags(["systems"], { apikey: masterKey, path }, version - 10)
				.catch((error) => {
					if(error.response){
						return error.response;
					}
				});
			expect(deleteExpired.status).toBe(412);

			const deleteLatest = await deleteTags(["systems"], { apikey: masterKey, path }, version);
			expect(deleteLatest.status).toBe(204);
		}
	);
});

describe("Mock fallback", () => {
	it("is called when no matching handler exists", async() => {
		const res = await axios.get("https://example.com/")
			.catch((error) => {
				if(error.response){
					return error.response;
				}
			});
		expect(res.status).toBe(404);
		expect(res.statusText).toBe("You need to add a handler for https://example.com/");
	});
});