import { ReactChildren } from "react";
import { renderHook, WrapperComponent } from "@testing-library/react-hooks";
import { mock } from "vitest-mock-extended";

import { TypemapProvider } from "Components/UserSettings";

import { QueryFilter } from "@services/search";

import { useItemFilters } from "./filters";
import { setupInitialSettings } from "../../../../setup";
import { ZCleanItemTop } from "Types/transforms";


const { typemap } = setupInitialSettings({});
const mockItem = mock<ZCleanItemTop>;

const wrapper: WrapperComponent<{ children: ReactChildren }> = ({ children }) => {
	return <TypemapProvider init={typemap} updater={vi.fn()}>{children}</TypemapProvider>;
};

describe("useItemFilters", async () => {
	const { result, waitFor } = renderHook(() => useItemFilters(), { wrapper });
	await waitFor(() => expect(result.current).toBeDefined());

	const filtersMap = result.current.filters.reduce<Record<string, QueryFilter<ZCleanItemTop>>>((obj, filter) => ({
		...obj, [filter.value]: filter
	}), {});

	it("returns a list of filters", () => {
		expect(result.current.filters.length).toBeGreaterThan(0);
		expectTypeOf(result.current.filters).toEqualTypeOf<QueryFilter<ZCleanItemTop>[]>;
	});

	describe("abstract", () => {
		const { evaluate } = filtersMap["abstract"];
		const cases = [
			{ item: mockItem({ abstract: "" }), query: "text", expected: false },
			{ item: mockItem({ abstract: "text" }), query: "string", expected: false },
			{ item: mockItem({ abstract: "TEXT" }), query: "text", expected: true },
			{ item: mockItem({ abstract: "text string some" }), query: "some text", expected: true }
		];

		test.each(cases)(
			"%#",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});

	describe("hasAbstract", () => {
		const { evaluate } = filtersMap["hasAbstract"];
		const cases = [
			{ item: mockItem({ abstract: "" }), query: "true", expected: false },
			{ item: mockItem({ abstract: "" }), query: "false", expected: true },
			{ item: mockItem({ abstract: "text" }), query: "true", expected: true },
			{ item: mockItem({ abstract: "text" }), query: "false", expected: false }
		];

		test.each(cases)(
			"%#",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});

	describe("hasCitekey", () => {
		const { evaluate } = filtersMap["hasCitekey"];
		const cases = [
			{ item: mockItem({ raw: { has_citekey: true } }), query: "true", expected: true },
			{ item: mockItem({ raw: { has_citekey: true } }), query: "false", expected: false },
			{ item: mockItem({ raw: { has_citekey: false } }), query: "true", expected: false },
			{ item: mockItem({ raw: { has_citekey: false } }), query: "false", expected: true }
		];

		test.each(cases)(
			"%#",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});

	describe("hasDOI", () => {
		const { evaluate } = filtersMap["hasDOI"];
		const cases = [
			{ item: mockItem({ raw: { data: { DOI: null } } }), query: "true", expected: false },
			{ item: mockItem({ raw: { data: { DOI: null } } }), query: "false", expected: true },
			{ item: mockItem({ raw: { data: { DOI: undefined } } }), query: "true", expected: false },
			{ item: mockItem({ raw: { data: { DOI: undefined } } }), query: "false", expected: true },
			{ item: mockItem({ raw: { data: { DOI: "" } } }), query: "true", expected: false },
			{ item: mockItem({ raw: { data: { DOI: "" } } }), query: "false", expected: true },
			{ item: mockItem({ raw: { data: { DOI: "1a2" } } }), query: "true", expected: true },
			{ item: mockItem({ raw: { data: { DOI: "1a2" } } }), query: "false", expected: false }
		];

		test.each(cases)(
			"%#",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});

	describe("addedBefore", () => {
		const { evaluate } = filtersMap["addedBefore"];

		beforeAll(() => {
			vi.useFakeTimers()
				.setSystemTime(new Date(2023, 7, 2, 22));
		});

		afterAll(() => {
			vi.useRealTimers();
		});

		const cases = [
			{ item: mockItem({ raw: { data: { dateAdded: "2023-08-02T00:00" } } }), query: "today", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-08-01T00:00" } } }), query: "today", expected: true },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-30T00:00" } } }), query: "this week", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-29T00:00" } } }), query: "this week", expected: true },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-01-02T00:00" } } }), query: "this year", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-01-01T00:00" } } }), query: "this year", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2022-12-31T00:00" } } }), query: "this year", expected: true },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-19T00:00" } } }), query: "last 2 weeks", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-18T00:00" } } }), query: "last 2 weeks", expected: true },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-31T00:00" } } }), query: "Monday", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-30T00:00" } } }), query: "Monday", expected: true },
			{ item: mockItem({ raw: { data: { dateAdded: "2020-03-01T00:00" } } }), query: "bad input", expected: false }
		];

		test.each(cases)(
			"%# - $query, $item.raw.data.dateAdded",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});

	describe("type", () => {
		const { evaluate } = filtersMap["type"];
		const cases = [
			{ item: mockItem({ itemType: "book" }), query: "article", expected: false },
			{ item: mockItem({ itemType: "book" }), query: "book", expected: true }
		];

		test.each(cases)(
			"%#",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});

	describe("hasNotes", () => {
		const { evaluate } = filtersMap["hasNotes"];
		const cases = [
			{ item: mockItem({ children: { notes: [] } }), query: "true", expected: false },
			{ item: mockItem({ children: { notes: [] } }), query: "false", expected: true },
			{ item: mockItem({ children: { notes: [{}] } }), query: "true", expected: true },
			{ item: mockItem({ children: { notes: [{}] } }), query: "false", expected: false }
		];

		test.each(cases)(
			"%#",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});

	describe("hasPDFs", () => {
		const { evaluate } = filtersMap["hasPDFs"];
		const cases = [
			{ item: mockItem({ children: { pdfs: [] } }), query: "true", expected: false },
			{ item: mockItem({ children: { pdfs: [] } }), query: "false", expected: true },
			{ item: mockItem({ children: { pdfs: [{}] } }), query: "true", expected: true },
			{ item: mockItem({ children: { pdfs: [{}] } }), query: "false", expected: false }
		];

		test.each(cases)(
			"%#",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});

	describe("inRoam", () => {
		const { evaluate } = filtersMap["inRoam"];
		const cases = [
			{ item: mockItem({ inGraph: false }), query: "true", expected: false },
			{ item: mockItem({ inGraph: false }), query: "false", expected: true },
			{ item: mockItem({ inGraph: "abc" }), query: "true", expected: true },
			{ item: mockItem({ inGraph: "def" }), query: "false", expected: false }
		];

		test.each(cases)(
			"%#",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});

	describe("tags", () => {
		const { evaluate } = filtersMap["tags"];
		const cases = [
			{ item: mockItem({ tags: [] }), query: "systems", expected: false },
			{ item: mockItem({ tags: ["todo"] }), query: "systems", expected: false },
			{ item: mockItem({ tags: ["systems thinking"] }), query: "systems", expected: false },
			{ item: mockItem({ tags: ["todo", "systems"] }), query: "systems", expected: true }
		];

		test.each(cases)(
			"%#",
			({ item, query, expected }) => {
				expect(evaluate(query, item)).toEqual(expected);
			}
		)
	});
});