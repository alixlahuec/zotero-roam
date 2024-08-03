import { ReactChildren } from "react";
import { renderHook, WrapperComponent } from "@testing-library/react-hooks";
import { mock } from "vitest-mock-extended";

import { TypemapProvider } from "Components/UserSettings";
import { QueryFilter } from "@hooks";

import { parseDateInThePast, parseDateRangeInThePast, useItemFilters } from "./filters";

import { setupInitialSettings } from "../../../setup";
import { ZCleanItemTop } from "Types/transforms";


const { typemap } = setupInitialSettings({});
const mockItem = (...args) => mock<ZCleanItemTop>(...args);

const wrapper: WrapperComponent<{ children: ReactChildren }> = ({ children }) => {
	return <TypemapProvider init={typemap} updater={vi.fn()}>{children}</TypemapProvider>;
};

describe("parseDateInThePast", () => {
	beforeAll(() => {
		vi.useFakeTimers()
			.setSystemTime(new Date(2021, 3, 6, 22, 14));
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	const cases = [
		{ query: "bad input", expected: null },
		{ query: "2019", expected: null },
		{ query: "Jan 2019", expected: new Date(2019, 0, 1, 0, 0, 0) },
		{ query: "Jan 13-Jan 17", expected: new Date(2021, 0, 13, 0, 0, 0)},
		{ query: "today", expected: new Date(2021, 3, 6, 0, 0, 0) },
		{ query: "last 2 days", expected: new Date(2021, 3, 4, 0, 0, 0) },
		{ query: "last 2 weeks", expected: new Date(2021, 2, 23, 0, 0, 0)},
		{ query: "this week", expected: new Date(2021, 3, 4, 0, 0, 0) },
		{ query: "this Monday", expected: new Date(2021, 3, 5, 0, 0, 0) },
		{ query: "this month", expected: new Date(2021, 3, 1, 0, 0, 0) },
		{ query: "this year", expected: new Date(2021, 0, 1, 0, 0, 0) }
	];

	test.each(cases)(
		"%# - $query, expect $expected",
		({ query, expected }) => {
			expect(parseDateInThePast(query)).toEqual(expected);
		}
	)
});

describe("parseDateRangeInThePast", () => {
	const currentDatetime = new Date(2021, 3, 6, 22, 14);
	beforeAll(() => {
		vi.useFakeTimers()
			.setSystemTime(currentDatetime);
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	const cases = [
		{ query: "bad input", expected: null },
		{ query: "Jan 2017 - Jan 2020", expected: [new Date(2017, 0, 1, 0, 0, 0), new Date(2020, 1, 1, 0, 0, 0)] },
		{ query: "Jan 3rd - Apr 5th", expected: [new Date(2021, 0, 3, 0, 0, 0), new Date(2021, 3, 6, 0, 0, 0)] },
		{ query: "Jan 2019", expected: [new Date(2019, 0, 1, 0, 0, 0), currentDatetime] },
		{ query: "last 2 days", expected: [new Date(2021, 3, 4, 0, 0, 0), currentDatetime] },
		{ query: "last 2 weeks", expected: [new Date(2021, 2, 23, 0, 0, 0), currentDatetime] },
		{ query: "this week", expected: [new Date(2021, 3, 4, 0, 0, 0), currentDatetime] },
		{ query: "this Monday", expected: [new Date(2021, 3, 5, 0, 0, 0), currentDatetime] },
		{ query: "this month", expected: [new Date(2021, 3, 1, 0, 0, 0), currentDatetime] },
		{ query: "this year", expected: [new Date(2021, 0, 1, 0, 0, 0), currentDatetime] },
		{ query: "Feb 2nd - today", expected: [new Date(2021, 1, 2, 0, 0, 0), new Date(2021, 3, 7, 0, 0, 0)] },
		// this doesn't work well because chrono is confident that the current time should be used in the start date
		{ query: "Feb 2nd - now", expected: [new Date(2021, 1, 2, 22, 14, 0), currentDatetime] },
	];

	test.each(cases)(
		"%# - $query, expect $expected",
		({ query, expected }) => {
			expect(parseDateRangeInThePast(query)).toEqual(expected);
		}
	)
});

describe("useItemFilters", async() => {
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
			{ item: mockItem({ raw: { data: { dateAdded: "2023-08-01T00:00"}}}), query: "today", expected: true },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-30T00:00" } } }), query: "this week", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-29T00:00" } } }), query: "this week", expected: true },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-01-02T00:00" } } }), query: "this year", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-01-01T00:00" } } }), query: "this year", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2022-12-31T00:00" } } }), query: "this year", expected: true },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-19T00:00" } } }), query: "last 2 weeks", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-18T00:00" } } }), query: "last 2 weeks", expected: true },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-31T00:00" } } }), query: "this Monday", expected: false },
			{ item: mockItem({ raw: { data: { dateAdded: "2023-07-30T00:00" } } }), query: "this Monday", expected: true },
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
			{ item: mockItem({ itemType: "book"}), query: "book", expected: true }
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
			{ item: mockItem({ inGraph: true }), query: "true", expected: true },
			{ item: mockItem({ inGraph: true }), query: "false", expected: false }
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