import { act, render } from "@testing-library/react";

import { webimportClass } from "../classes";
import { hasNodeListChanged } from "../../../utils";
import { findWebimportDivs, setWebimportDivs } from "./utils";

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