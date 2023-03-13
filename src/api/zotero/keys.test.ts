import { fetchPermissions } from "./keys";

import { apiKeys } from "Mocks/zotero/keys";


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
