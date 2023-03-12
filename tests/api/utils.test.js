import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

import { fetchBibEntries, fetchBibliography, fetchItems, writeItems } from "../../src/api/utils";

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