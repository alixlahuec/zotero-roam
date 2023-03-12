import { fetchDeleted } from "./deleted";

import { apiKeys } from "Mocks/zotero/keys";
import { deletions } from "Mocks/zotero/deleted";
import { libraries } from "Mocks/zotero/libraries";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;

describe("Fetching mocked deleted entities", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Fetching entities deleted from %s",
		async (_libName, libraryDetails) => {
			const { path } = libraryDetails;
			const deleted = await fetchDeleted({ apikey: masterKey, path }, 0);
			expect(deleted).toEqual({
				...deletions[path].map(del => del.key),
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