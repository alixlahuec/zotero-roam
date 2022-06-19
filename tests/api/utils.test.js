import axios from "axios";
import { data as citoids } from "../../mocks/citoid";
import { findCollections } from "../../mocks/zotero/collections";
import { data as apiKeys } from "../../mocks/zotero/keys";
import { data as libraries } from "../../mocks/zotero/libraries";
import { fetchCitoid, fetchCollections, fetchPermissions } from "../../src/api/utils";

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
			expect(collections).toEqual({
				data: findCollections(type, id, since),
				lastUpdated: version
			});
		}
	);
});

describe("Fetching mocked Citoid data", () => {
	const cases = Object.entries(citoids);
	test.each(cases)(
		"%# Fetching Citoid data for %s",
		async(identifier, itemData) => {
			const citoid = await fetchCitoid(identifier);
			expect(citoid).toEqual({
				item: itemData,
				query: identifier
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

	it("returns a 301 code when the request is for Roam CSS assets", async() => {
		const res = await axios.get("https://roamresearch.com/assets/css/fonts/Inter/Inter-Light-BETA.woff2")
			.catch((error) => {
				if(error.response){
					return error.response;
				}
			});
		expect(res.status).toBe(301);
	});
});