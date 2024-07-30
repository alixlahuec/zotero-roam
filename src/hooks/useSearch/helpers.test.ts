import { runSearch } from "./helpers";


type Item = {
	created: number,
	roam: boolean,
	title: string
};


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