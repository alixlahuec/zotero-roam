import { QueryClient } from "react-query";
import { fetchItems } from "../../src/api/utils";
import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";

const { keyWithFullAccess: { key: masterKey }} = apiKeys;

describe("Zotero client handles errors", () => {
	const cases = [
		[
			"server error",
			500,
			...Object.entries(libraries)[0]
		],
		[
			"bad request error",
			400,
			...Object.entries(libraries)[1]
		]
	];
	const queryClient = new QueryClient();

	test.each(cases)(
		"%# Handling %s (%s) - fetching items for %s",
		async(_testId, errorCode, _libName, libraryDetails) => {
			const { path } = libraryDetails;

			const res = await fetchItems(
				{ apikey: masterKey, dataURI: `${path}/items`, library: path, params: `enforced-error=${errorCode}`, since: 0 },
				{ match: [] },
				queryClient
			).catch((error) => {
				if(error.response){
					return error.response;
				}
			});

			expect(res.status).toBe(errorCode);
		}
	);

});