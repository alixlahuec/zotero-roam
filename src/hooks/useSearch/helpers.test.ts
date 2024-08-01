import { computeCursorPosition, computeSuggestions, isIncompleteFilter, isIncompleteFreeText, parseQueryTerms, runSearch } from "./helpers";
import { QueryFilter } from "./types";


type Item = {
	created: number,
	roam: boolean,
	title: string
};

const filters: QueryFilter<Item>[] = [
	{
		label: "Item created",
		value: "created",
		presets: [
			{ label: "Today", value: "today" },
			{ label: "Last 24h", value: "-1d" },
			{ label: "Last 7 days", value: "-7d" }
		],
		evaluate: (query, item) => {
			return item.created == Number(query);
		}
	},
	{
		label: "Exists in Roam",
		value: "roam",
		presets: [
			{ label: "Yes", value: "true" },
			{ label: "No", value: "false" }
		],
		evaluate: (query, item) => {
			const boolCheck = query == "true" ? true : false;
			return item.roam == boolCheck;
		}
	}
];


describe("computeCursorPosition", () => {
	const cases = [
		{ terms: [""], cursorPosition: 0, expectedResult: { position: 0, term: "", termIndex: 0 } },
		{ terms: ["text"], cursorPosition: 4, expectedResult: { position: 4, term: "text", termIndex: 0 } },
		{ terms: ["text ", ""], cursorPosition: 5, expectedResult: { position: 0, term: "", termIndex: 1 } },
		{ terms: ["inRoam:"], cursorPosition: 7, expectedResult: { position: 7, term: "inRoam:", termIndex: 0 } },
		{ terms: ["inRoam: ", ""], cursorPosition: 8, expectedResult: { position: 0, term: "", termIndex: 1 } },
		{ terms: ["inRoam:true"], cursorPosition: 11, expectedResult: { position: 11, term: "inRoam:true", termIndex: 0 } },
		{ terms: ["inRoam:true ", ""], cursorPosition: 12, expectedResult: { position: 0, term: "", termIndex: 1 } },
		{ terms: ["inRoam:true ", "text"], cursorPosition: 12, expectedResult: { position: 0, term: "text", termIndex: 1 } },
	];

	test.each(cases)(
		"%s",
		({ terms, cursorPosition, expectedResult }) => {
			expect(computeCursorPosition(terms, cursorPosition)).toEqual(expectedResult);
		}
	)
});


describe("computeSuggestions", () => {
	const cases = [
		{ term: "", position: 0, expected: filters },
		{ term: "#", position: 0, expected: [] },
		{ term: "#", position: 1, expected: [] },
		{ term: "roa", position: 0, expected: [] },
		{ term: "roa", position: 1, expected: [filters[1]] },
		{ term: "exists", position: 6, expected: [filters[1]] },
		{ term: "roam:", position: 5, expected: filters[1].presets },
		{ term: "roam:t", position: 6, expected: [] },
		{ term: "something:", position: 10, expected: [] },
		{ term: "roam:\"true", position: 10, expected: [] },
		{ term: "roam:\"true\"", position: 11, expected: [] },
		{ term: "\"text string", position: 12, expected: [] },
		{ term: "roam exists", position: 11, expected: [filters[1]] },
		{ term: "\"roam exists", position: 12, expected: [] }
	];

	test.each(cases)(
		"$term, cursor at $position",
		({ term, position, expected }) => {
			expect(computeSuggestions({ filters, position, term })).toEqual(expected);
		}
	)
});


describe("isIncompleteFilter", () => {
	const cases = [
		{ term: "", expected: false },
		{ term: "operator", expected: false },
		{ term: "operator ", expected: false },
		{ term: "operator:", expected: true },
		{ term: "operator: ", expected: false },
		{ term: "operator:text", expected: false },
		{ term: "operator:text ", expected: false },
		{ term: "operator:\"", expected: true },
		{ term: "operator:\" ", expected: true },
		{ term: "operator:\"text", expected: true },
		{ term: "operator:\"text ", expected: true },
		{ term: "operator:\"text\"", expected: false },
		{ term: "operator:\"text\" ", expected: false }
	];

	test.each(cases)(
		"$term should return $expected",
		({ term, expected }) => {
			expect(isIncompleteFilter(term)).toBe(expected);
		}
	);
});


describe("isIncompleteFreeText", () => {
	const cases = [
		{ term: "", expected: false },
		{ term: " ", expected: false },
		{ term: "text", expected: false },
		{ term: "text ", expected: false },
		{ term: "text string", expected: false },
		{ term: "text string ", expected: false },
		{ term: "\"", expected: true },
		{ term: "\"text", expected: true },
		{ term: "\"text ", expected: true },
		{ term: "\"text\"", expected: false },
		{ term: "\"text\" ", expected: false }
	];

	test.each(cases)(
		"$term should return $expected",
		({ term, expected }) => {
			expect(isIncompleteFreeText(term)).toBe(expected);
		}
	)
});


describe("parseQueryTerms", () => {
	const cases = [
		{ query: "", terms: [""] },
		{ query: "i", terms: ["i"] },
		{ query: "i ", terms: ["i ", ""] },
		{ query: "inRoam", terms: ["inRoam"] },
		{ query: "inRoam:", terms: ["inRoam:"] },
		{ query: "inRoam:true", terms: ["inRoam:true"] },
		{ query: "inRoam:true ", terms: ["inRoam:true ", ""] },
		{ query: `abstract:"`, terms: [`abstract:"`] },
		{ query: `abstract:"text string`, terms: [`abstract:"text string`] },
		{ query: `abstract:"text string"`, terms: [`abstract:"text string"`] },
		{ query: "text abstract:string", terms: ["text ", "abstract:string"] },
		{ query: "abstract:string text", terms: ["abstract:string ", "text"] },
		{ query: "inRoam:true abstract:string", terms: ["inRoam:true ", "abstract:string"] }
	];

	test.each(cases)(
		"$query",
		({ query, terms }) => expect(parseQueryTerms(query)).toEqual(terms)
	)
});


describe("runSearch", () => {
	const items: Item[] = [
		{ created: 111, roam: true, title: "Some Book" },
		{ created: 222, roam: false, title: "Some Paper" }
	];

	it("returns all items when the query is empty", () => {
		expect(runSearch([""], items, "title")).toEqual(items);
		expect(runSearch([""], items, undefined)).toEqual(items);
	});

	describe("free-text search", () => {
		it("returns all items when no searchable field is provided", () => {
			expect(runSearch(["paper"], items, undefined)).toEqual(items);
		});

		it("returns filtered items when a searchable field is provided", () => {
			expect(runSearch(["book"], items, "title")).toEqual([items[0]]);
		});
	});

	describe("filter-based search", () => {
		const cases = [
			[true, true, items.length, items.length, items],
			[false, true, items.length, 0, []],
		] as const;

		const termQuery1 = "true";
		const termQuery2 = "false";

		test.each(cases)(
			"%#",
			(evaluate1, evaluate2, expectedCalls1, expectedCalls2, expectedResults) => {
				const termEvaluate1 = vi.fn(() => evaluate1);
				const termEvaluate2 = vi.fn(() => evaluate2);

				expect(
					runSearch(
						[
							{
								filter: {
									evaluate: termEvaluate1,
									label: "Roam page exists",
									presets: [],
									value: "roam"
								},
								query: termQuery1
							},
							{
								filter: {
									evaluate: termEvaluate2,
									label: "DOI exists",
									presets: [],
									value: "hasDOI"
								},
								query: termQuery2
							}
						],
						items,
						undefined
					)
				).toEqual(expectedResults);

				expect(termEvaluate1.mock.calls).toHaveLength(expectedCalls1);
				expect(termEvaluate1.mock.calls[0]).toEqual([termQuery1, items[0]]);
				expect(termEvaluate1.mock.calls[1]).toEqual([termQuery1, items[1]]);
				expect(termEvaluate2.mock.calls).toHaveLength(expectedCalls2);
			}
		)

	});
});