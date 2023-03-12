import { fetchCitoid, writeCitoids } from "./citoid";

import { citoids } from "Mocks/citoid";
import { makeItemMetadata } from "Mocks/zotero/common";
import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";

import { CitoidZotero } from "Types/externals/citoid";


type MockCitoidSuccessResponse = CitoidZotero & { status?: number };
type MockCitoidErrorResponse = {
	status: number,
	method: "get",
	type: string,
	uri: string
};
// type MockCitoidResponse = MockCitoidSuccessResponse | MockCitoidErrorResponse;

const { keyWithFullAccess: { key: masterKey } } = apiKeys;

// https://stackoverflow.com/a/73913774/21032793
const isFulfilled = <T,>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> => p.status === 'fulfilled';

describe("Fetching mocked Citoid data", () => {
	const { success_cases, error_cases } = Object.entries(citoids)
		.reduce<{success_cases: [string, MockCitoidSuccessResponse][], error_cases: [string, MockCitoidErrorResponse][]}>((obj, entry) => {
			const { status = 200 } = entry[1];
			if (status == 200) {
				obj.success_cases.push(entry);
			} else {
				obj.error_cases.push(entry);
			}
			return obj;
		}, { success_cases: [], error_cases: [] });

	test.each(success_cases)(
		"%# Successfully mocking Citoid data for %s",
		async (identifier, itemData) => {
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
		async (identifier, itemData) => {
			const { status, ...output } = itemData;
			const res = await fetchCitoid(identifier)
				.catch((error) => {
					if (error.response) {
						return error.response;
					}
				});
			expect(res.status).toBe(status);
			expect(res.data).toEqual([output]);
		}
	);

});

describe("Writing mocked Citoid data", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Adding a Citoid to %s",
		async (_libName, libraryDetails) => {
			const { path, version } = libraryDetails;

			const res = await writeCitoids(
				[{ title: "TEST_TITLE" }] as CitoidZotero[],
				{
					library: { apikey: masterKey, path },
					collections: [],
					tags: []
				}
			);

			const data = res.filter(isFulfilled).map(rq => rq.value.data);

			expect(data).toEqual([{
				failed: {},
				unchanged: {},
				success: {
					0: "__NO_UNIQUE_KEY__"
				},
				successful: {
					0: {
						...makeItemMetadata({
							library: libraryDetails,
							version,
							data: {
								title: "TEST_TITLE"
							}
						})
					}
				}
			}]);
		}
	);
});
