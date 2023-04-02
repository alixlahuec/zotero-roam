import { fetchCitoid } from ".";
import { citoids } from "Mocks/citoid";
import { Mocks } from "Mocks/types";


function isFailure(response: Mocks.Responses.Citoid): response is Mocks.Responses.CitoidError {
	return (response as Mocks.Responses.CitoidError).status !== undefined;
}

describe("Fetching mocked Citoid data", () => {
	const { success_cases, error_cases } = Object.entries(citoids)
		.reduce<{ success_cases: [string, Mocks.Responses.CitoidSuccess][], error_cases: [string, Mocks.Responses.CitoidError][] }>((obj, entry) => {
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
