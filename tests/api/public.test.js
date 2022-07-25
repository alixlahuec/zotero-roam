import { QueryClient } from "@tanstack/react-query";

import { sampleAnnot } from "Mocks/zotero/annotations";
import { entries, items } from "Mocks/zotero/items";
import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";
import { sampleNote } from "Mocks/zotero/notes";

import * as publicUtils from "../../src/api/public";

const { _getBibEntries, _getItems } = publicUtils;

const { keyWithFullAccess: { key: masterKey }} = apiKeys;

test("get bibliographic entries", async() => {

	jest.spyOn(publicUtils, "_getItems").mockReturnValue(items);

	const citekeys = Object.keys(entries);
	const expected = Object.values(entries).map(entry => entry.biblatex).join("\n");

	const libraryList = Object.values(libraries).map(lib => ({ apikey: masterKey, path: lib.path }));
	const client = new QueryClient();

	const bibs = await _getBibEntries(citekeys, libraryList, client);

	expect(bibs)
		.toEqual(expected);
});

test("get library items", () => {
	const client = new QueryClient();
	client.getQueriesData = jest.fn(() => [["query key", { data: [...items, sampleAnnot, sampleNote]}]]);

	expect(_getItems("all", {}, client))
		.toEqual([...items, sampleAnnot, sampleNote]);
    
	expect(_getItems("annotations", {}, client))
		.toEqual([sampleAnnot]);
    
	expect(_getItems("attachments", {}, client))
		.toEqual([]);

	expect(_getItems("children", {}, client))
		.toEqual([sampleAnnot, sampleNote]);
    
	expect(_getItems("items", {}, client))
		.toEqual([...items]);
    
	expect(_getItems("notes", {}, client))
		.toEqual([sampleNote]);

	expect(_getItems("pdfs", {}, client))
		.toEqual([]);
});