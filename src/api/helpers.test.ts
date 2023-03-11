import { extractCitekeys, matchWithCurrentData } from "./helpers";

import { items } from "Mocks/zotero/items";


test("Extracting citekeys for Zotero items", () => {
	const cases = [
		{ key: "ABCD1234", data: { extra: "Citation Key: someCitekey1994" } },
		{ key: "PQRST789", data: { extra: "" } }
	];

	const expectations = [
		{ key: "someCitekey1994", data: { extra: "Citation Key: someCitekey1994" }, has_citekey: true },
		{ key: "PQRST789", data: { extra: "" }, has_citekey: false }
	];

	expect(extractCitekeys(cases)).toEqual(expectations);
	expect(extractCitekeys(items)).toEqual(items);

});

test("Merging data updates", () => {
	const itemsList = [
		{ data: { key: "ABC" }, key: "someCitekey" },
		{ data: { key: "DEF" }, key: "DEF" },
		{ data: { key: "GHI" }, key: "GHI" }
	];

	expect(matchWithCurrentData(
		{
			modified: [itemsList[1]],
			deleted: []
		},
		[itemsList[0]],
		{ with_citekey: false }
	))
		.toEqual([itemsList[0], itemsList[1]]);

	expect(matchWithCurrentData(
		{
			modified: [itemsList[2]],
			deleted: []
		},
		itemsList,
		{ with_citekey: false }
	))
		.toEqual(itemsList);

	expect(matchWithCurrentData(
		{
			modified: [],
			deleted: [itemsList[0].data.key]
		},
		[itemsList[0]],
		{ with_citekey: false }
	))
		.toEqual([]);

	expect(matchWithCurrentData(
		{
			modified: [itemsList[1]],
			deleted: [itemsList[2].data.key]
		},
		itemsList,
		{ with_citekey: false }
	))
		.toEqual(itemsList.slice(0, 2));
});