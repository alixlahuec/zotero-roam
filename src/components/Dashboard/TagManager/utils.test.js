import { getTagStats, getTagUsage, isSingleton, makeSuggestionFor, matchTagData, sortTags } from "./utils";

jest.mock("../../../roam", () => ({
	getInitialedPages: () => [
		{title: "culture", uid: "abcdef"},
		{title: "systems", uid: "pqrst"}
	]
}));

const tagList = [
	{
		roam: [{title: "TODO"}],
		zotero: [
			{tag: "TODO", meta: {type: 1, numItems: 2}},
			{tag: "todo", meta: {type: 0, numItems: 4}}
		]
	},
	{
		roam: [{title: "history"}],
		zotero: [
			{tag:"history", meta: {type: 1, numItems: 13}}
		]
	},
	{
		roam: [],
		zotero: [
			{tag: "culture", meta: {type: 0, numItems: 7}},
			{tag: "Culture", meta: {type: 1, numItems: 1}}
		]
	}
];

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
	expect(getTagUsage(tagList[0], { count_roam: false})).toBe(6);
	expect(getTagUsage(tagList[1], { count_roam: true })).toBe(14);
	expect(getTagUsage(tagList[2])).toBe(8);
});

test("Identifies singleton tags", () => {
	expect(isSingleton({roam: [], zotero: [{tag: "culture"}]})).toBe(true);
	expect(isSingleton({roam: [{title: "culture"}], zotero: [{tag: "culture"}]})).toBe(true);
	expect(isSingleton({roam: [{title: "Culture"}], zotero: [{tag: "culture"}]})).toBe(false);
	expect(isSingleton({roam: [], zotero: [{tag: "culture"}, {tag: "Culture"}]})).toBe(false);
});

test("Makes correct suggestions for tags", () => {
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
			recommend: null,
			type: "manual",
			use: {
				roam: [],
				zotero: ["culture", "Culture"]
			}
		});
    
	expect(makeSuggestionFor({
		roam: [],
		zotero: [{tag: "PKM"}]
	}))
		.toEqual({
			recommend: "PKM",
			type: null,
			use: {
				roam: [],
				zotero: ["PKM"]
			}
		});
    
	expect(makeSuggestionFor({
		roam: [],
		zotero: [{tag: "PKM", meta: {type: 0}}, {tag: "PKM", meta: {type: 1}}]
	}))
		.toEqual({
			recommend: "PKM",
			type: "auto",
			use: {
				roam: [],
				zotero: ["PKM"]
			}
		});
    
	expect(makeSuggestionFor({
		roam: [{title: "housing"}, {title: "Housing"}],
		zotero: [{tag: "housing"}]
	}))
		.toEqual({
			recommend: null,
			type: "manual",
			use: {
				roam: ["housing", "Housing"],
				zotero: []
			}
		});
});

test("Match Zotero tags with Roam pages", async() => {
	const tags = {
		"c": [{token: "culture", roam: [], zotero: [{tag: "culture"}]}],
		"s": [
			{token: "stocks", roam: [], zotero: [{tag: "stocks"}]},
			{token: "systems", roam: [], zotero: [{tag: "systems"}]}
		]
	};

	await expect(matchTagData(tags))
		.resolves
		.toEqual([
			{token: "culture", roam: [{title: "culture", uid: "abcdef"}], zotero: [{tag: "culture"}]},
			{token: "stocks", roam: [], zotero: [{tag: "stocks"}]},
			{token: "systems", roam: [{title: "systems", uid: "pqrst"}], zotero: [{tag: "systems"}]}
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