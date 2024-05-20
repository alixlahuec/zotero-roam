import { vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { _getItemCreators, _getItemTags } from "./public";

import { ZItemTop } from "Types/transforms";


vi.mock("@services/roam", (() => ({
	findRoamPage: () => false
})));

describe("Retrieving creators data for an item", () => {
	const mockItem = mock<ZItemTop>({
		data: {
			creators: [
				{ name: "Gary Bloch", creatorType: "author" },
				{ name: "Linda Rozmovits", creatorType: "author" }
			]
		}
	});

	const cases = [
		[
			{ return_as: "identity" },
			[
				{ name: "Gary Bloch", type: "author", inGraph: false },
				{ name: "Linda Rozmovits", type: "author", inGraph: false }
			]
		],
		[
			{ return_as: "array" },
			[
				"Gary Bloch",
				"Linda Rozmovits"
			]
		],
		[
			{ return_as: "string", brackets: true, use_type: true },
			"[[Gary Bloch]], [[Linda Rozmovits]]"
		],
		[
			{ return_as: "string", brackets: false, use_type: true },
			"Gary Bloch, Linda Rozmovits"
		]
	] as const;

	test.each(cases)(
		"%#",
		(config, expectation) => {
			expect(_getItemCreators(mockItem, config))
				.toEqual(expectation);
		}
	);

});

describe("Retrieving tags data for an item", () => {
	const mockItem = mock<ZItemTop>({
		data: {
			tags: [{ tag: "housing" }]
		}
	});

	const cases = [
		[{ return_as: "array", brackets: false }, ["housing"]],
		[{ return_as: "array", brackets: true }, ["#[[housing]]"]],
		[{ return_as: "string", brackets: false }, "housing"],
		[{ return_as: "string", brackets: true }, "#[[housing]]"],
		[{}, "#[[housing]]"]
	] as const;

	test.each(cases)(
		"%#",
		(config, expectation) => {
			expect(_getItemTags(mockItem, config))
				.toEqual(expectation);
		}
	);

});
