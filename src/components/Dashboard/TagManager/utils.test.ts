import { mock } from "jest-mock-extended";
import { getTagStats, getTagUsage, isSingleton, makeSuggestionFor, matchTagData, sortTags } from "./utils";
import { ZTagEntry, ZTagList } from "Types/transforms";


jest.mock("Roam", () => ({
	getInitialedPages: () => [
		{ title: "culture", uid: "abcdef" },
		{ title: "systems", uid: "pqrst" }
	]
}));

const tagList = [
	{
		roam: [{ title: "TODO" }],
		zotero: [
			{ tag: "TODO", meta: { type: 1, numItems: 2 } },
			{ tag: "todo", meta: { type: 0, numItems: 4 } }
		]
	},
	{
		roam: [{ title: "history" }],
		zotero: [
			{ tag: "history", meta: { type: 1, numItems: 13 } }
		]
	},
	{
		roam: [],
		zotero: [
			{ tag: "culture", meta: { type: 0, numItems: 7 } },
			{ tag: "Culture", meta: { type: 1, numItems: 1 } }
		]
	}
].map(it => mock<ZTagEntry>(it));

test("Collects tag stats", () => {
	expect(getTagStats(tagList))
		.toEqual({
			nTags: 5,
			nAuto: 3,
			nRoam: 2,
			nTotal: 3
		});
});

test("Counts tag usage", () => {
	expect(getTagUsage(tagList[0], { count_roam: false })).toBe(6);
	expect(getTagUsage(tagList[1], { count_roam: true })).toBe(14);
	expect(getTagUsage(tagList[2])).toBe(8);
});

describe("Identifies singleton tags", () => {
	const cases = [
		[{ roam: [], zotero: [{ tag: "culture" }] }, true],
		[{ roam: [{ title: "culture" }], zotero: [{ tag: "culture" }] }, true],
		[{ roam: [{ title: "Culture" }], zotero: [{ tag: "culture" }] }, false],
		[{ roam: [], zotero: [{ tag: "culture" }, { tag: "Culture" }] }, false]
	] as const;

	test.each(cases)(
		"%s",
		(tagEntry, expectation) => {
			const mockTag = mock<ZTagEntry>(tagEntry as any);
			expect(isSingleton(mockTag)).toBe(expectation);
		}
	);
});

describe("Makes correct suggestions for tags", () => {
	expect(makeSuggestionFor(tagList[0]))
		.toEqual({
			recommend: "TODO",
			type: "auto",
			use: {
				roam: ["TODO"],
				zotero: ["todo"]
			}
		});
	expect(makeSuggestionFor(tagList[1]))
		.toEqual({
			recommend: "history",
			type: null,
			use: {
				roam: ["history"],
				zotero: []
			}
		});
	expect(makeSuggestionFor(tagList[2]))
		.toEqual({
			recommend: "culture",
			type: "manual",
			use: {
				roam: [],
				zotero: ["culture", "Culture"]
			}
		});
	
	const cases = [
		[
			{ roam: [], zotero: [{ tag: "PKM" }] },
			{
				recommend: "PKM",
				type: null,
				use: { roam: [], zotero: ["PKM"] }
			}
		],
		[
			{
				roam: [],
				zotero: [{ tag: "PKM", meta: { type: 0 } }, { tag: "PKM", meta: { type: 1 } }]
			},
			{
				recommend: "PKM",
				type: "auto",
				use: { roam: [], zotero: ["PKM"] }
			}
		],
		[
			{
				roam: [{ title: "housing" }, { title: "Housing" }],
				zotero: [{ tag: "housing" }]
			},
			{
				recommend: null,
				type: "manual",
				use: {
					roam: ["housing", "Housing"],
					zotero: []
				}
			}
		]
	] as const;
    
	test.each(cases)(
		"%s",
		(tagEntry, expectation) => {
			const mockTag = mock<ZTagEntry>(tagEntry as any);
			expect(makeSuggestionFor(mockTag)).toEqual(expectation);
		}
	);

});

test("Match Zotero tags with Roam pages", async() => {
	const tags = {
		"c": [{ token: "culture", roam: [], zotero: [{ tag: "culture" }] }],
		"s": [
			{ token: "stocks", roam: [], zotero: [{ tag: "stocks" }] },
			{ token: "systems", roam: [], zotero: [{ tag: "systems" }] }
		]
	};

	await expect(matchTagData(mock<ZTagList>(tags)))
		.resolves
		.toEqual([
			{ token: "culture", roam: [{ title: "culture", uid: "abcdef" }], zotero: [{ tag: "culture" }] },
			{ token: "stocks", roam: [], zotero: [{ tag: "stocks" }] },
			{ token: "systems", roam: [{ title: "systems", uid: "pqrst" }], zotero: [{ tag: "systems" }] }
		]);
});

test("Sorts tags list", () => {
	expect(sortTags(tagList, "alphabetical"))
		.toEqual(tagList);
	expect(sortTags(tagList, "roam"))
		.toEqual([tagList[0], tagList[1], tagList[2]]);
	expect(sortTags(tagList, "usage"))
		.toEqual([tagList[1], tagList[2], tagList[0]]);
});