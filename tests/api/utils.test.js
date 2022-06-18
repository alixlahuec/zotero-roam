import axios from "axios";
import { findCollections } from "../../mocks/zotero/collections";
import { data as apiKeys } from "../../mocks/zotero/keys";
import { data as libraries } from "../../mocks/zotero/libraries";
import { fetchCollections, fetchPermissions } from "../../src/api/utils";

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

describe("Fetching mocked collections", () => {
	const cases = Object.entries(libraries);
	test.each(cases)(
		"%# Fetching all collections for %s",
		async(_libName, libraryDetails) => {
			const since = 0;
			const { id, path, type, version } = libraryDetails;
			const collections = await fetchCollections({ apikey: apiKeys.keyWithFullAccess.key, path }, since, { match: [] });
			expect(collections.data).toEqual({
				data: findCollections(type, id, since),
				lastUpdated: version
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