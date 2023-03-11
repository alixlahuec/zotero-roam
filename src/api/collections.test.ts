import { fetchCollections } from "./collections";
import { fetchAdditionalData } from "./utils";

import { apiKeys } from "Mocks/zotero/keys";
import { findCollections } from "Mocks/zotero/collections";
import { libraries } from "Mocks/zotero/libraries";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;

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
			const mockAdditional = await fetchAdditionalData(
				{ apikey: masterKey, dataURI: `${path}/collections`, since: 0 },
				allCollections.length + 100
			);
			expect(mockAdditional).toEqual(allCollections);
		}
	);
});