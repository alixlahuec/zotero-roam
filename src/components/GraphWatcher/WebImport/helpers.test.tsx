import { act, render } from "@testing-library/react";

import { hasNodeListChanged } from "../helpers";
import { findWebimportDivs, matchArrays, setWebimportDivs } from "./helpers";

import { webimportClass } from "../classes";
import { blockWithAliasedLink } from "../fixtures";


describe("WebImport divs are inserted", () => {
	const triggerTags = ["web-import"];
	const TaggedBlock = () => blockWithAliasedLink(triggerTags);
	const UntaggedBlock = () => blockWithAliasedLink([]);

	const cases = [
		[TaggedBlock, 1],
		[UntaggedBlock, 0]
	] as const;

	test.each(cases)(
		"%#",
		(Component, expected_divs_count) => {
			const { container } = render(<Component />);

			expect(findWebimportDivs()).toEqual([]);

			act(() => setWebimportDivs(triggerTags));

			const allDivs = findWebimportDivs();

			expect(hasNodeListChanged(
				allDivs,
				container.querySelectorAll(`[class=${webimportClass}]`)
			)).toBe(false);

			expect(allDivs).toHaveLength(expected_divs_count);

			if (expected_divs_count > 0) {
				act(() => Array.from(container.querySelectorAll("[data-page-links]"))
					.forEach(el => el.setAttribute("data-page-links", "[]"))
				);

				act(() => setWebimportDivs(triggerTags));

				const updatedDivs = findWebimportDivs();

				expect(hasNodeListChanged(allDivs, updatedDivs)).toBe(true);
				expect(updatedDivs).toHaveLength(0);
			}
		}
	);
});

describe("matchArrays", () => {
	it("Finds if two string arrays have elements in common", () => {
		const arr1 = ["tools", "platforms", "models"];
		const arr2 = ["makers", "founders", "tools"];
		const arr3 = ["makers", "founders", "companies"];
	
		expect([
			matchArrays(arr1, arr2),
			matchArrays(arr1, arr3)
		])
			.toEqual([
				true,
				false
			]);
	});
});