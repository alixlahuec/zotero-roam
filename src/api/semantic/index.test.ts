import { fetchSemantic, parseSemanticDOIs } from ".";

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
				citations: parseSemanticDOIs(citations),
				references: parseSemanticDOIs(references)
			});
		}
	);
});

test("Selecting and formatting Semantic DOIs", () => {
	const testItems = [
		{ doi: null },
		{ doi: "invalid.DOI" },
		{ doi: "10.1186/S40985-018-0094-7" },
		{ doi: "10.1370/afm.1918" }
	];

	expect(parseSemanticDOIs(testItems))
		.toEqual([
			{ doi: false },
			{ doi: false },
			{ doi: "10.1186/s40985-018-0094-7" },
			{ doi: "10.1370/afm.1918" }
		]);
});
