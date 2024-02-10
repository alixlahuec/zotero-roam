import { fetchSemantic } from "./base";
import { transformDOIs } from "../../utils";
import { semantics } from "Mocks/semantic-scholar";


describe("Fetching mocked Semantic data", () => {
	const cases = Object.entries(semantics);
	test.each(cases)(
		"%# Successfully mocking Semantic data for %s",
		async (doi, semanticData) => {
			const { citations, references } = semanticData;

			const res = await fetchSemantic(doi);

			expect(res).toEqual({
				doi,
				citations: transformDOIs(citations),
				references: transformDOIs(references)
			});
		}
	);
});