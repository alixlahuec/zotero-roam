import { QueryClient } from "@tanstack/react-query";

import * as base from "./base";
import { makeTagList } from "./helpers";
import { ZoteroAPI } from "./types";

import { apiKeys, bibs, deletions, findBibliographyEntry, findBibEntry, findCollections, findItems, libraries, tags } from "Mocks";

import { isFulfilled } from "Types/helpers";


const { deleteTags, fetchAdditionalData, fetchBibEntries, fetchBibliography, fetchCollections, fetchDeleted, fetchItems, fetchPermissions, fetchTags, writeItems } = base;

const { keyWithFullAccess: { key: masterKey } } = apiKeys;

const getLibraryPath = (library) => {
	return library.type + "s/" + library.id;
};


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

describe("writeItems", () => {
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

describe("fetchTags", () => {
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

describe("deleteTags", () => {
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