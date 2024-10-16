import { mock } from "vitest-mock-extended";

import { filterHasEvaluate, QueryFilter } from "@services/search";

import { pdfFilters } from "./filters";
import { ZCleanItemPDF, ZItemAnnotation } from "Types/transforms";

const mockAnnotation = mock<ZItemAnnotation>;
const mockPDF = mock<ZCleanItemPDF>;
const filtersMap = pdfFilters.reduce<Record<string, QueryFilter<ZCleanItemPDF>>>((obj, filter) => ({
	...obj, [filter.value]: filter
}), {});

const assertFilterResult = (filter: QueryFilter, { query, item, expected }: { query: string, item: any, expected: boolean }) => {
	if (filterHasEvaluate(filter)) {
		expect(filter.evaluate(query, item)).toEqual(expected);
	} else {
		expect(Boolean(filter.filter(query, [item]))).toEqual(expected);
	}
}

describe("hasAnnotations", () => {
	const filter = filtersMap["hasAnnotations"];
	const cases = [
		{ item: mockPDF({ annotations: [] }), query: "true", expected: false },
		{ item: mockPDF({ annotations: [] }), query: "false", expected: true },
		{ item: mockPDF({ annotations: [mockAnnotation()] }), query: "true", expected: true },
		{ item: mockPDF({ annotations: [mockAnnotation()] }), query: "false", expected: false }
	];

	test.each(cases)(
		"%#",
		({ item, query, expected }) => {
			assertFilterResult(filter, { query, item, expected })
		}
	)
});

describe("tags", () => {
	const filter = filtersMap["tags"];
	const cases = [
		{ item: mockPDF({ tags: [] }), query: "systems", expected: false },
		{ item: mockPDF({ tags: ["todo"] }), query: "systems", expected: false },
		{ item: mockPDF({ tags: ["systems thinking"] }), query: "systems", expected: false },
		{ item: mockPDF({ tags: ["todo", "systems"] }), query: "systems", expected: true }
	];

	test.each(cases)(
		"%#",
		({ item, query, expected }) => {
			assertFilterResult(filter, { query, item, expected })
		}
	)
});
