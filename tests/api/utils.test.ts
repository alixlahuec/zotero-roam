import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

import { areTagsDuplicate, cleanBibliographyHTML, deleteTags, extractCitekeys, fetchAdditionalData, fetchBibEntries, fetchBibliography, fetchCitoid, fetchCollections, fetchDeleted, fetchItems, fetchPermissions, fetchSemantic, fetchTags, makeTagList, matchWithCurrentData, parseSemanticDOIs, updateTagMap, writeItems } from "../../src/api/utils";
import { makeDictionary } from "../../src/utils";

import { apiKeys, bibs, citoids, deletions, findBibliographyEntry, findBibEntry, findCollections, findItems, findTags, items, libraries, semantics, tags, Mocks } from "Mocks";

import { ZoteroAPI } from "Types/externals";
import { isFulfilled } from "Types/helpers";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary, groupLibrary } = libraries;
const getLibraryPath = (library) => {
	return library.type + "s/" + library.id;
};

describe("Cleaning XHTML markup for bibliography entries", () => {
	// Necessary since jsdom does not support innerText
	// It shouldn't give discrepant results here
	// https://github.com/jsdom/jsdom/issues/1245#issuecomment-763535573
	beforeAll(() => {
		Object.defineProperty(HTMLElement.prototype, "innerText", {
			get() {
				return this.textContent;
			}
		});
	});

	it("should correctly format citations with one content div (like Chicago)", () => {
		expect(cleanBibliographyHTML(bibs.itemFromUserLibrary.bib))
			.toBe("Agarwal, Payal, Rick Wang, Christopher Meaney, Sakina Walji, Ali Damji, Navsheer Gill Toor, Gina Yip, et al. “Sociodemographic Differences in Patient Experience with Virtual Care during COVID-19.” medRxiv, July 22, 2021. https://www.medrxiv.org/content/10.1101/2021.07.19.21260373v1.");
	});

	it("should correctly format citations with multiple content divs (like Vancouver)", () => {
		const sample_bib_vancouver = "<div class=\"csl-bib-body\" style=\"line-height: 1.35; \">\n  <div class=\"csl-entry\" style=\"clear: left; \">\n    <div class=\"csl-left-margin\" style=\"float: left; padding-right: 0.5em; text-align: right; width: 1em;\">1. </div><div class=\"csl-right-inline\" style=\"margin: 0 .4em 0 1.5em;\">MacDonald K, Fainman-Adelman N, Anderson KK, Iyer SN. Pathways to mental health services for young people: a systematic review. Soc Psychiatry Psychiatr Epidemiol. 2018 Oct;53(10):1005&#x2013;38.</div>\n   </div>\n</div>";

		expect(cleanBibliographyHTML(sample_bib_vancouver))
			.toBe("1. MacDonald K, Fainman-Adelman N, Anderson KK, Iyer SN. Pathways to mental health services for young people: a systematic review. Soc Psychiatry Psychiatr Epidemiol. 2018 Oct;53(10):1005–38.");
	});
});

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

test("Selecting and formatting Semantic DOIs", () => {
	const testItems = [
		{ doi: null },
		{ doi: "invalid.DOI" },
		{ doi: "10.1186/S40985-018-0094-7" },
		{ doi: "10.1370/afm.1918" }
	];

	expect(parseSemanticDOIs(testItems))
		.toEqual([
			{ doi: false },
			{ doi: false },
			{ doi: "10.1186/s40985-018-0094-7" },
			{ doi: "10.1370/afm.1918" }
		]);
});

describe("Fetching mocked API Key permissions", () => {
	const cases = Object.entries(apiKeys);
	test.each(cases)(
		"%# Fetching permissions for %s",
		async (_keyName, expectation) => {
			const permissions = await fetchPermissions(expectation.key);
			expect(permissions).toEqual(expectation);
		}
	);
});

describe("Fetching mocked bibliography", () => {
	const cases = Object.entries(bibs);
	test.each(cases)(
		"%# Fetching bibliography as bib for %s",
		async (_bibName, entry) => {
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
		async (_libName, libraryDetails) => {
			const { type, id, path } = libraryDetails;
			const sample_item = findItems({ type, id, since: 0 })[0];

			const res = await fetchBibEntries([sample_item.data.key], { apikey: masterKey, path });

			const sample_bib = findBibEntry({ type, id, key: sample_item.data.key })!;

			expect(res).toBe(sample_bib.biblatex);
		}
	);
});

describe("Fetching mocked collections", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# There should be no items older than latest in %s",
		(_libName, libraryDetails) => {
			const { type, id, version } = libraryDetails;
			expect(findCollections(type, id, version)).toEqual([]);
		}
	);

	test.each(cases)(
		"%# Fetching collections for %s",
		async (_libName, libraryDetails) => {
			const { id, path, type, version } = libraryDetails;
			const libraryObj = {
				apikey: masterKey,
				path
			};

			const allCollections = findCollections(type, id, 0);

			const sinceEver = await fetchCollections(
				libraryObj,
				0,
				{ match: [] }
			);
			expect(sinceEver).toEqual({
				data: allCollections,
				lastUpdated: version
			});

			const sinceLatest = await fetchCollections(
				libraryObj,
				version,
				{ match: sinceEver.data }
			);
			expect(sinceLatest).toEqual({
				data: allCollections,
				lastUpdated: version
			});

			// To cover fetchAdditionalData
			const mockAdditional = await fetchAdditionalData<ZoteroAPI.Responses.Collections>(
				{ apikey: masterKey, dataURI: `${path}/collections`, since: 0 },
				allCollections.length + 100
			);
			expect(mockAdditional).toEqual(allCollections);
		}
	);
});

describe("Fetching mocked deleted entities", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Fetching entities deleted from %s",
		async (_libName, libraryDetails) => {
			const { path } = libraryDetails;
			const deleted = await fetchDeleted({ apikey: masterKey, path }, 0);
			expect(deleted).toEqual({
				collections: deletions[path].collections.map(del => del.key),
				items: deletions[path].items.map(del => del.key),
				searches: [],
				tags: []
			});
		}
	);

	test.each(cases)(
		"%# Checking that no entities are versioned over latest in %s",
		async (_libName, libraryDetails) => {
			const { path, version } = libraryDetails;
			const deleted = await fetchDeleted({ apikey: masterKey, path }, version);
			expect(deleted).toEqual({
				collections: [],
				items: [],
				searches: [],
				tags: []
			});
		}
	);
});

describe("Fetching mocked items", () => {
	const cases = Object.entries(libraries);
	const queryClient = new QueryClient();

	test.each(cases)(
		"%# Fetching items for %s",
		async (_libName, libraryDetails) => {
			const { type, id, path, version } = libraryDetails;

			const itemData = findItems({ type, id, since: 0 });

			const library = {
				id: `${id}`,
				path,
				type,
				uri: `${path}/items`
			};

			const sinceEver = await fetchItems(
				{ apikey: masterKey, dataURI: `${path}/items`, library, name: "", since: 0 },
				{ match: [] },
				queryClient
			);
			expect(sinceEver).toEqual({
				data: itemData,
				lastUpdated: version
			});

			const sinceLatest = await fetchItems(
				{ apikey: masterKey, dataURI: `${path}/items`, library, name: "", since: version },
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
		async (_libName, libraryDetails) => {
			const { type, id, path } = libraryDetails;
			const sample_item = findItems({ type, id, since: 0 })[0];

			const res = await writeItems<Pick<ZoteroAPI.ItemTop["data"], "key" | "version" | "tags">>(
				[{ key: sample_item.data.key, version: sample_item.version, tags: [{ tag: "TEST_TAG", type: 0 }] }],
				{ apikey: masterKey, path });

			const data = res.filter(isFulfilled).map(rq => rq.value.data);

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
							...sample_item.data,
							tags: [{ tag: "TEST_TAG", type: 0 }]
						}
					}
				}
			}]);

			const resWithFailure = await writeItems<Pick<ZoteroAPI.ItemTop["data"], "key" | "version" | "tags">>(
				[{ key: sample_item.data.key, version: sample_item.version - 1, tags: [{ tag: "TEST_TAG", type: 0 }] }],
				{ apikey: masterKey, path });

			const dataWithFailure = resWithFailure.filter(isFulfilled).map(rq => rq.value.data);

			expect(dataWithFailure).toEqual([{
				failed: {
					0: sample_item.data.key
				},
				unchanged: {
					0: sample_item.data.key
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

describe("Fetching mocked Citoid data", () => {
	function isFailure(response: Mocks.Responses.Citoid): response is Mocks.Responses.CitoidError {
		return (response as Mocks.Responses.CitoidError).status !== undefined;
	}

	const { success_cases, error_cases } = Object.entries(citoids)
		.reduce<{ success_cases: [string, Mocks.Responses.CitoidSuccess][], error_cases: [string, Mocks.Responses.CitoidError][] }>((obj, entry) => {
			const [identifier, res] = entry;
			if (isFailure(res)) {
				obj.error_cases.push([identifier, res]);
			} else {
				obj.success_cases.push([identifier, res]);
			}
			return obj;
		}, { success_cases: [], error_cases: [] });

	test.each(success_cases)(
		"%# Successfully mocking Citoid data for %s",
		async (identifier, itemData) => {
			const { status, ...output } = itemData;
			const citoid = await fetchCitoid(identifier);
			expect(citoid).toEqual({
				item: output,
				query: identifier
			});
		}
	);

	test.each(error_cases)(
		"%# Successfully mocking Citoid error for %s",
		async (identifier, itemData) => {
			const res = await fetchCitoid(identifier)
				.catch((error) => {
					if (error.response) {
						return error.response;
					}
				});
			expect(res.status).toBe(itemData.status);
			expect(res.data).toEqual([itemData]);
		}
	);
    
});

describe("Fetching mocked Semantic data", () => {
	const cases = Object.entries(semantics);
	test.each(cases)(
		"%# Successfully mocking Semantic data for %s",
		async (doi, semanticData) => {
			const { citations, references } = semanticData;

			const res = await fetchSemantic(doi);

			expect(res).toEqual({
				doi,
				citations: parseSemanticDOIs(citations),
				references: parseSemanticDOIs(references)
			});
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