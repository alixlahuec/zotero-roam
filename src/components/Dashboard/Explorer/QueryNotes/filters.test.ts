import { mock } from "vitest-mock-extended";

import { QueryFilter } from "@services/search";

import { noteFilters } from "./filters";
import { ZItemAnnotation, ZItemNote } from "Types/transforms";

const mockAnnotation = mock<ZItemAnnotation>;

const filtersMap = noteFilters.reduce<Record<string, QueryFilter<ZItemNote | ZItemAnnotation>>>((obj, filter) => ({
	...obj, [filter.value]: filter
}), {});

describe("tags", () => {
	const { evaluate } = filtersMap["tags"];
	const cases = [
		{ item: mockAnnotation({ data: { tags: [] }}), query: "systems", expected: false },
		{ item: mockAnnotation({ data: { tags: [{ tag: "todo" }] }}), query: "systems", expected: false },
		{ item: mockAnnotation({ data: { tags: [{ tag: "systems thinking" }] }}), query: "systems", expected: false },
		{ item: mockAnnotation({ data: { tags: [{ tag: "todo" }, { tag: "systems" }] }}), query: "systems", expected: true }
	];

	test.each(cases)(
		"%#",
		({ item, query, expected }) => {
			expect(evaluate(query, item)).toEqual(expected);
		}
	)
});
