import axios from "axios";
import { data as citoids } from "../../mocks/citoid";
import { findCollections } from "../../mocks/zotero/collections";
import { data as apiKeys } from "../../mocks/zotero/keys";
import { data as libraries } from "../../mocks/zotero/libraries";
import { extractCitekeys, fetchCitoid, fetchCollections, fetchPermissions } from "../../src/api/utils";

test("Extracting citekeys for Zotero items", () => {
	const cases = [
		{ key: "ABCD1234", data: { extra: "Citation Key: someCitekey1994" }},
		{ key: "PQRST789", data: { extra: "" }}
	];

	const expectations = [
		{ key: "someCitekey1994", data: { extra: "Citation Key: someCitekey1994" }, has_citekey: true },
		{ key: "PQRST789", data: { extra: "" }, has_citekey: false}
	];

	expect(extractCitekeys(cases)).toEqual(expectations);
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
	const { success_cases, error_cases } = Object.entries(citoids).reduce((obj, entry) => {
		const { status = 200 } = entry[1];
		if(status == 200){
			obj.success_cases.push(entry);
		} else {
			obj.error_cases.push(entry);
		}
		return obj;
	}, { success_cases: [], error_cases: [] });

	test.each(success_cases)(
		"%# Successfully mocking Citoid data for %s",
		async(identifier, itemData) => {
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
		async(identifier, itemData) => {
			const { status, ...output } = itemData;
			const res = await fetchCitoid(identifier)
				.catch((error) => {
					if(error.response){
						return error.response;
					}
				});
			expect(res.status).toBe(status);
			expect(res.data).toEqual([output]);
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