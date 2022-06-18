import axios from "axios";
import { data as apiKeys } from "../../mocks/zotero/keys";
import { fetchPermissions } from "../../src/api/utils";

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