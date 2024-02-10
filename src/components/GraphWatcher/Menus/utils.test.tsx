import { act, render } from "@testing-library/react";
import {
	CitekeyPageValid,
	CitekeyPageInvalid,
	DnpLogWithItems,
	DnpLogWithoutItems,
	DnpPageWithItems,
	DnpPageWithoutItems,
	DnpPreviewWithItems,
	NormalPageWithoutTaggingContent,
	NormalPageWithTaggingContent
} from "../fixtures";

import { hasNodeListChanged } from "../helpers";
import { addPageMenus, findPageMenus } from "./utils";
import { menuClasses } from "../classes";


// Necessary since jsdom does not support innerText
// It shouldn't give discrepant results here
// https://github.com/jsdom/jsdom/issues/1245#issuecomment-763535573
beforeAll(() => {
	Object.defineProperty(HTMLElement.prototype, "innerText", {
		get() {
			return this.textContent;
		}
	});
});


describe("Citekey menu containers are inserted", () => {
	const cases = [
		[CitekeyPageValid, 1, "blochImplementingSocialInterventions2021"],
		[CitekeyPageInvalid, 1, "nonExistentCitekey"]
	] as const;

	test.each(cases)(
		"%#",
		(Component, expected_menus_count, expected_citekey) => {
			const { container } = render(<Component />);

			expect(findPageMenus()).toMatchObject({
				citekeyMenus: [],
				dnpMenus: [],
				tagMenus: []
			});

			act(() => addPageMenus());

			const allMenus = findPageMenus();

			expect(hasNodeListChanged(
				allMenus.citekeyMenus,
				container.querySelectorAll(`[class=${menuClasses.citekey}]`)
			)).toBe(false);

			expect(allMenus.citekeyMenus).toHaveLength(expected_menus_count);
			if (expected_citekey) {
				expect(allMenus.citekeyMenus[0].getAttribute("data-citekey")).toBe(expected_citekey);
			}
		}
	);
});


describe("DNP menu containers are inserted", () => {
	const cases = [
		[DnpLogWithItems, 1, "[2021,10,12]"],
		[DnpPageWithItems, 1, "[2021,5,19]"],
		[DnpLogWithoutItems, 1, "[1999,3,6]"],
		[DnpPageWithoutItems, 1, "[1999,3,6]"],
		[DnpPreviewWithItems, 0, null]
	] as const;

	test.each(cases)(
		"%#",
		(Component, expected_menus_count, expected_dnp_date) => {
			const { container } = render(<Component />);

			expect(findPageMenus()).toMatchObject({
				citekeyMenus: [],
				dnpMenus: [],
				tagMenus: []
			});

			act(() => addPageMenus());

			const allMenus = findPageMenus();

			expect(hasNodeListChanged(
				allMenus.dnpMenus,
				container.querySelectorAll(`[class=${menuClasses.dnp}]`)
			)).toBe(false);

			expect(allMenus.dnpMenus).toHaveLength(expected_menus_count);
			if (expected_dnp_date) {
				expect(allMenus.dnpMenus[0].getAttribute("data-dnp-date")).toBe(expected_dnp_date);
			}

		}
	);
});


describe("Tag menu containers are inserted", () => {
	const cases = [
		[NormalPageWithoutTaggingContent, 1, "September"],
		[NormalPageWithTaggingContent, 1, "housing"]
	] as const;

	test.each(cases)(
		"%#",
		(Component, expected_menus_count, expected_title) => {
			const { container } = render(<Component />);

			expect(findPageMenus()).toMatchObject({
				citekeyMenus: [],
				dnpMenus: [],
				tagMenus: []
			});

			act(() => addPageMenus());

			const allMenus = findPageMenus();

			expect(hasNodeListChanged(
				allMenus.tagMenus,
				container.querySelectorAll(`[class=${menuClasses.tag}]`)
			)).toBe(false);

			expect(allMenus.tagMenus).toHaveLength(expected_menus_count);
			if (expected_title) {
				expect(allMenus.tagMenus[0].getAttribute("data-title")).toBe(expected_title);
			}
		}
	);
});
