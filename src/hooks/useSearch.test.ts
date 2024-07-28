import { renderHook } from "@testing-library/react-hooks";

import { Filter, useSearch, useSearchFilters } from "./useSearch";


type Item = {
	created: number,
	roam: boolean,
	title: string
};

const filters: Filter<Item>[] = [
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

describe("useSearchFilters", () => {
	it("returns nothing when the query is empty", async () => {
		const { result, waitFor } = renderHook(() => useSearchFilters({ query: "", cursorPosition: 0, filters }));

		await waitFor(() => expect(result.current.terms).toEqual([]));

		expect(result.current.term).toBe("");
		expect(result.current.position).toBe(0);
		expect(result.current.suggestions).toEqual([]);
	});

	describe("with fully qualified query", () => {
		const query = "roam:true";
		const cases = [0, 2, 5, 7, 9];

		test.each(cases)(
			"returns no suggestions - cursor at %s",
			async (cursorPosition) => {
				const { result, waitFor } = renderHook(() => useSearchFilters({ query, cursorPosition, filters }));

				await waitFor(() => expect(result.current.terms).toEqual([query]));

				expect(result.current.term).toBe(query);
				expect(result.current.position).toBe(cursorPosition);
				expect(result.current.suggestions).toEqual([]);
			}
		)
	});

	describe("with partially typed operator", () => {
		const query = "ro";
		const matchingFilters = [filters[1]];

		const cases = [
			[0, []],
			[1, matchingFilters],
			[2, matchingFilters]
		] as const;

		test.each(cases)(
			"returns filters with matching name - #%d",
			async (cursorPosition, expected_suggestions) => {
				const { result, waitFor } = renderHook(() => useSearchFilters({ query, cursorPosition, filters }));

				await waitFor(() => expect(result.current.terms).toEqual([query]));

				expect(result.current.term).toBe(query);
				expect(result.current.position).toBe(cursorPosition);
				expect(result.current.suggestions).toEqual(expected_suggestions);
			}
		)
	});

	it("returns presets when the user has selected an operator", async () => {
		const { result, waitFor } = renderHook(() => useSearchFilters({ query: "roam:", cursorPosition: 5, filters }));

		await waitFor(() => expect(result.current.terms).toEqual(["roam:"]));

		expect(result.current.term).toBe("roam:");
		expect(result.current.position).toBe(5);
		expect(result.current.suggestions).toEqual(filters[1].presets);
	});
});


describe("useSearch", () => {
	const items: Item[] = [
		{ created: 111, roam: true, title: "An Examination of a Subject" },
		{ created: 222, roam: false, title: "A Subject: An Essay" }
	];

	it("matches items with filters", async () => {
		const filterEvaluateSpy = vi.spyOn(filters[1], "evaluate");

		const { result, waitFor } = renderHook(() => useSearch({ query: "roam:true", filters, items }));

		await waitFor(() => expect(result.current).toBeDefined());

		expect(result.current).toEqual([items[0]]);
		expect(filterEvaluateSpy.mock.calls).toHaveLength(2);
		expect(filterEvaluateSpy.mock.calls[0]).toEqual(["true", items[0]]);
		expect(filterEvaluateSpy.mock.calls[1]).toEqual(["true", items[1]]);
	});

	it("matches items with free-text search when enabled", async () => {
		const { result, waitFor } = renderHook(() => useSearch({ query: "essay", filters, items, search_field: "title" }));

		await waitFor(() => expect(result.current).toBeDefined());

		expect(result.current).toEqual([items[1]]);
	});

	it("ignores free-text search when disabled", async () => {
		const { result, waitFor } = renderHook(() => useSearch({ query: "history", filters, items }));

		await waitFor(() => expect(result.current).toBeDefined());

		expect(result.current).toEqual(items);
	})
});