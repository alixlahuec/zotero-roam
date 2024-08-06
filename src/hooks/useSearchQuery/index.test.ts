import { act, renderHook } from "@testing-library/react-hooks";

import { QueryFilter, useSearchQuery } from ".";


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

const handleQueryChange = vi.fn();
const setCursorPosition = vi.fn();


describe("useSearchQuery", () => {
	it("returns all filters when the query is empty", async () => {
		const { result, waitFor } = renderHook(() => useSearchQuery({ query: "", cursorPosition: 0, filters, handleQueryChange, setCursorPosition }));

		await waitFor(() => expect(result.current.terms).toBeDefined());

		expect(result.current).toEqual({
			applySuggestion: expect.any(Function),
			position: 0,
			search: expect.any(Function),
			term: "",
			termIndex: 0,
			terms: [""],
			suggestions: filters
		});
	});

	describe("with fully qualified query", () => {
		const query = "roam:true doi:true";
		const terms = ["roam:true ", "doi:true"];
		
		const firstTermCases = [0, 2, 5, 7, 9];
		test.each(firstTermCases)(
			"returns no suggestions - cursor at %s",
			async (cursorPosition) => {
				const { result, waitFor } = renderHook(() => useSearchQuery({ query, cursorPosition, filters, handleQueryChange, setCursorPosition }));

				await waitFor(() => expect(result.current.terms).toBeDefined());

				expect(result.current).toEqual({
					applySuggestion: expect.any(Function),
					position: cursorPosition,
					search: expect.any(Function),
					term: terms[0],
					termIndex: 0,
					terms,
					suggestions: []
				});
			}
		)

		const secondTermCases = [10, 12, 14, 16, 18];
		test.each(secondTermCases)(
			"returns no suggestions - cursor at %s",
			async (cursorPosition) => {
				const { result, waitFor } = renderHook(() => useSearchQuery({ query, cursorPosition, filters, handleQueryChange, setCursorPosition }));

				await waitFor(() => expect(result.current.terms).toBeDefined());

				expect(result.current).toEqual({
					applySuggestion: expect.any(Function),
					position: cursorPosition - terms[0].length,
					search: expect.any(Function),
					term: terms[1],
					termIndex: 1,
					terms,
					suggestions: []
				});
			}
		)

	});

	describe("with fully qualified query and a trailing space", () => {
		it("returns all filters", async () => {
			const query = "roam:true ";
			const { result, waitFor } = renderHook(() => useSearchQuery({ query, cursorPosition: 10, filters, handleQueryChange, setCursorPosition }));

			await waitFor(() => expect(result.current.terms).toBeDefined());

			expect(result.current).toEqual({
				applySuggestion: expect.any(Function),
				position: 0,
				search: expect.any(Function),
				term: "",
				termIndex: 1,
				terms: [query, ""],
				suggestions: filters
			});
		});
	});

	describe("with partially typed operator", () => {
		const query = "ro";
		const matchingFilters = [filters[1]];

		const cases = [
			{ cursorPosition: 0, expectedSuggestions: [] },
			{ cursorPosition: 1, expectedSuggestions: matchingFilters },
			{ cursorPosition: 2, expectedSuggestions: matchingFilters }
		];

		test.each(cases)(
			"returns filters with matching name - %# - $expectedSuggestions.length results",
			async ({ cursorPosition, expectedSuggestions }) => {
				const { result, waitFor } = renderHook(() => useSearchQuery({ query, cursorPosition, filters, handleQueryChange, setCursorPosition }));

				await waitFor(() => expect(result.current.terms).toBeDefined());

				expect(result.current).toEqual({
					applySuggestion: expect.any(Function),
					position: cursorPosition,
					search: expect.any(Function),
					term: query,
					termIndex: 0,
					terms: [query],
					suggestions: expectedSuggestions
				});
			}
		)
	});

	it("returns presets when the user has selected an operator", async () => {
		const query = "roam:";
		const { result, waitFor } = renderHook(() => useSearchQuery({ query, cursorPosition: 5, filters, handleQueryChange, setCursorPosition }));

		await waitFor(() => expect(result.current.terms).toBeDefined());

		expect(result.current).toEqual({
			applySuggestion: expect.any(Function),
			position: 5,
			search: expect.any(Function),
			term: query,
			termIndex: 0,
			terms: [query],
			suggestions: filters[1].presets
		});
	});

	describe("applySuggestion", () => {
		describe("it auto-completes filter operators", async () => {
			const cases = [
				{ query: "", cursorPosition: 0, suggestion: filters[0] },
				{ query: "ro", cursorPosition: 0, suggestion: filters[0] },
				{ query: "ro", cursorPosition: 1, suggestion: filters[0] },
				{ query: "ro", cursorPosition: 2, suggestion: filters[0] },
				{ query: "", cursorPosition: 0, suggestion: filters[1] },
				{ query: "ro", cursorPosition: 0, suggestion: filters[1] },
				{ query: "ro", cursorPosition: 1, suggestion: filters[1] },
				{ query: "ro", cursorPosition: 2, suggestion: filters[1] }
			];

			test.each(cases)(
				"%# - $query, cursor at $cursorPosition -> $suggestion.value",
				async ({ query, cursorPosition, suggestion }) => {
					const { result, waitFor } = renderHook(() => useSearchQuery({ cursorPosition, query, handleQueryChange, filters, setCursorPosition }));
		
					await waitFor(() => expect(result.current.suggestions).toBeDefined());
		
					act(() => result.current.applySuggestion(suggestion));

					expect(handleQueryChange).toBeCalledTimes(1);
					expect(handleQueryChange).toBeCalledWith(suggestion.value + ":");

					expect(setCursorPosition).toBeCalledTimes(1);
					expect(setCursorPosition).toBeCalledWith(suggestion.value.length + 1);
				}
			)
		});
		
		describe("it inserts filter presets", async () => {
			const cases = [
				{ query: filters[0].value + ":", suggestion: filters[0].presets[0] },
				{ query: filters[0].value + ":", suggestion: filters[0].presets[1] },
				{ query: filters[0].value + ":", suggestion: filters[0].presets[2] },
				{ query: filters[1].value + ":", suggestion: filters[1].presets[0] },
				{ query: filters[1].value + ":", suggestion: filters[1].presets[1] },
			];

			test.each(cases)(
				"%# - $query $suggestion.value",
				async ({ query, suggestion }) => {
					const { result, waitFor } = renderHook(() => useSearchQuery({ cursorPosition: query.length, query, handleQueryChange, filters, setCursorPosition }));

					await waitFor(() => expect(result.current.suggestions).toBeDefined());

					act(() => result.current.applySuggestion(suggestion));

					expect(handleQueryChange).toBeCalledTimes(1);
					expect(handleQueryChange).toBeCalledWith(query + suggestion.value);

					expect(setCursorPosition).toBeCalledTimes(1);
					expect(setCursorPosition).toBeCalledWith(query.length + suggestion.value.length)
				}
			)
		});
	});

	describe("search", () => {
		const items: Item[] = [
			{ created: 111, roam: true, title: "An Examination of a Subject" },
			{ created: 222, roam: false, title: "A Subject: An Essay" }
		];

		it("matches items with filters", async () => {
			const filterEvaluateSpy = vi.spyOn(filters[1], "evaluate");

			const { result, waitFor } = renderHook(() => useSearchQuery({ cursorPosition: 0, query: "roam:true", filters, handleQueryChange, setCursorPosition }));

			await waitFor(() => expect(result.current).toBeDefined());

			await expect(result.current.search(items)).toEqual([items[0]]);

			expect(filterEvaluateSpy).toBeCalledTimes(2);
			expect(filterEvaluateSpy.mock.calls[0]).toEqual(["true", items[0]]);
			expect(filterEvaluateSpy.mock.calls[1]).toEqual(["true", items[1]]);
		});

		it("matches items with free-text search when enabled", async () => {
			const { result, waitFor } = renderHook(() => useSearchQuery({ cursorPosition: 0, query: "essay", filters, handleQueryChange, search_field: "title", setCursorPosition }));

			await waitFor(() => expect(result.current).toBeDefined());

			await expect(result.current.search(items)).toEqual([items[1]]);
		});

		it("ignores free-text search when disabled", async () => {
			const { result, waitFor } = renderHook(() => useSearchQuery({ cursorPosition: 0, query: "history", filters, handleQueryChange, setCursorPosition }));

			await waitFor(() => expect(result.current).toBeDefined());

			await expect(result.current.search(items)).toEqual(items);
		});
	});
});
