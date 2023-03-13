import { fetchCitoid } from "./index";
import { citoids } from "Mocks/citoid";
import { CitoidZotero } from "Types/externals/citoid";


type MockCitoidSuccessResponse = CitoidZotero & { status?: number };
type MockCitoidErrorResponse = {
	status: number,
	method: "get",
	type: string,
	uri: string
};
// type MockCitoidResponse = MockCitoidSuccessResponse | MockCitoidErrorResponse;

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
