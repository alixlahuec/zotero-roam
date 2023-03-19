import { QueryClient } from "@tanstack/react-query";
import { fetchBibEntries, fetchBibliography, fetchItems, writeItems } from "./items";

import { apiKeys } from "Mocks/zotero/keys";
import { bibs, findBibliographyEntry } from "Mocks/zotero/bib";
import { findBibEntry, findItems } from "Mocks/zotero/items";
import { libraries } from "Mocks/zotero/libraries";

import { isFulfilled } from "Types/common";
import { ZoteroAPI } from "Types/externals";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const getLibraryPath = (library) => {
	return library.type + "s/" + library.id;
};

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

			const sample_bib = findBibEntry({ type, id, key: sample_item.data.key });

			expect(res).toBe(sample_bib?.biblatex);
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
					0: sample_item
				},
				success: {},
				successful: {}
			}]);
		}
	);
});