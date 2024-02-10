import { fetchCitoid } from "./base";

import { citoids, Mocks } from "Mocks";


describe("fetchCitoid", () => {
	function isFailure(response: typeof citoids[keyof typeof citoids]): response is Mocks.Responses.CitoidError {
		return (response as Mocks.Responses.CitoidError).status !== undefined;
	}

	const { success_cases, error_cases } = Object.entries(citoids)
		.reduce<{ success_cases: [string, Mocks.Responses.CitoidSuccess[number]][], error_cases: [string, Mocks.Responses.CitoidError][] }>((obj, entry) => {
			const [identifier, res] = entry;
			if (isFailure(res)) {
				obj.error_cases.push([identifier, res]);
			} else {
				obj.success_cases.push([identifier, res]);
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
			const res = await fetchCitoid(identifier)
				.catch((error) => {
					if (error.response) {
						return error.response;
					}
				});
			expect(res.status).toBe(itemData.status);
			expect(res.data).toEqual([itemData]);
		}
	);

});