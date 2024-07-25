import { QueryClient } from "@tanstack/query-core";
import { mock } from "vitest-mock-extended";

import { analyzeUserRequests, setupInitialSettings } from "../../setup";
import ZoteroRoam from "../../api";

import { sbCommands } from ".";
import { reformatImportableBlocks } from "./helpers";
import { SmartblocksPlugin } from "./types";

import { getLocalLink, getWebLink } from "../../utils";

import { Mocks, apiKeys, bibs, findCollections, findItems, items, libraries, sampleNote, samplePDF } from "Mocks";
import { makeDNP } from "Mocks/roam";


const { userLibrary, groupLibrary } = libraries;
const { keyWithFullAccess: { key: masterKey } } = apiKeys;

const defaultReqs = [
	{ dataURI: userLibrary.path + "/items", apikey: masterKey, name: "My user library" },
	{ dataURI: groupLibrary.path + "/items", apikey: masterKey, name: "My group library" }
];
const initRequests = analyzeUserRequests(defaultReqs);
const initSettings = setupInitialSettings({});


describe("All commands return correct output", () => {
	let client: QueryClient;
	let commands: ReturnType<typeof sbCommands>;

	const mockContext = (vars: SmartblocksPlugin.CommandContext["variables"] = {}) => mock<SmartblocksPlugin.CommandContext>({
		variables: { ...vars }
	});

	beforeEach(() => {
		client = new QueryClient();
		window.zoteroRoam = new ZoteroRoam({
			queryClient: client,
			requests: initRequests,
			settings: initSettings
		});

		commands = sbCommands();
	});

	test("ZOTERORANDOMCITEKEY", () => {
		const item_with_housing_tag = items.find(it => it.key == "pintoExploringDifferentMethods2021")!;
		
		// getItems() retrieves queries data with an inclusive query,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData(
			["items"],
			(_prev) => ({
				data: [item_with_housing_tag],
				lastUpdated: 9999
			})
		);

		expect(commands.ZOTERORANDOMCITEKEY.handler(mockContext())())
			.toEqual([item_with_housing_tag]
				.map(it => "@" + it.key)
			);
		
		expect(commands.ZOTERORANDOMCITEKEY.handler(mockContext())("invalid number"))
			.toEqual([item_with_housing_tag]
				.map(it => "@" + it.key)
			);

		// getItems() retrieves queries data with an inclusive query,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData(
			["items"],
			(_prev) => ({
				data: items,
				lastUpdated: 9999
			})
		);
		
		expect(commands.ZOTERORANDOMCITEKEY.handler(mockContext())("1", "housing"))
			.toEqual([item_with_housing_tag]
				.map(it => "@" + it.key)
			);
		
		const with_multiple_items = commands.ZOTERORANDOMCITEKEY.handler(mockContext())(items.length.toString());
		expect(with_multiple_items.length).toEqual(items.length);
		items.forEach(it => {
			expect(with_multiple_items.includes("@" + it.key)).toBe(true);
		});
			
	});

	test("ZOTEROITEMABSTRACT", () => {
		const sample_item = items.find(it => it.data.abstractNote !== "")!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMABSTRACT.handler(context)())
			.toEqual(sample_item.data.abstractNote);
	});

	describe("ZOTEROITEMCITATION", () => {
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

		test("It returns the correct output", async() => {
			const sample_bib = bibs.itemInLibrary;
			const { library: { type, id } } = sample_bib;
			const sample_item = findItems({ type: `${type}s`, id, since: 0 }).find(it => it.data.key == sample_bib.key)!;
			const context = mockContext({ item: sample_item });

			const bib_with_defaults = await window.zoteroRoam.getItemCitation(sample_item, {});

			expect(await commands.ZOTEROITEMCITATION.handler(context)())
				.toEqual(bib_with_defaults);
		});
	});

	test("ZOTEROITEMCITEKEY", () => {
		const sample_item = items.find(it => it.key)!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMCITEKEY.handler(context)())
			.toEqual(`[[@${sample_item.key}]]`);
		expect(commands.ZOTEROITEMCITEKEY.handler(context)(false))
			.toEqual("@" + sample_item.key);
	});

	test("ZOTEROITEMCOLLECTIONS", () => {
		Object.values(libraries).forEach(lib => {
			const { path, version } = lib;
			const [type, id] = path.split("/");
			const colls = findCollections(type as Mocks.Library["type"], Number(id), 0);

			client.setQueryData(
				["collections", { library: path }],
				(_prev) => ({
					data: colls,
					lastUpdated: version
				})
			);
		});

		const sample_item = items.find(it => it.data.collections.length > 0)!;
		const collectionList = findCollections(`${sample_item.library.type}s`, sample_item.library.id, 0);
		const expectedColls = sample_item.data.collections
			.map(key => collectionList.find(coll => coll.key == key)!.data.name);
		const context = mockContext({ item: sample_item });
	
		expect(commands.ZOTEROITEMCOLLECTIONS.handler(context)())
			.toEqual(expectedColls.map(coll => `[[${coll}]]`).join(", "));
		expect(commands.ZOTEROITEMCOLLECTIONS.handler(context)(false))
			.toEqual(expectedColls.join(", "));
	});

	test("ZOTEROITEMCREATORS", () => {
		const sample_item = items.find(it => it.data.creators.length > 0)!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMCREATORS.handler(context)())
			.toEqual(window.zoteroRoam.getItemCreators(sample_item, { return_as: "string", brackets: true, use_type: true }));
		expect(commands.ZOTEROITEMCREATORS.handler(context)(true, false))
			.toEqual(window.zoteroRoam.getItemCreators(sample_item, { return_as: "string", brackets: true, use_type: false }));
		expect(commands.ZOTEROITEMCREATORS.handler(context)(false))
			.toEqual(window.zoteroRoam.getItemCreators(sample_item, { return_as: "string", brackets: false, use_type: true }));
		expect(commands.ZOTEROITEMCREATORS.handler(context)(false, false))
			.toEqual(window.zoteroRoam.getItemCreators(sample_item, { return_as: "string", brackets: false, use_type: false }));
	});

	test("ZOTEROITEMDATEADDED", () => {
		const sample_item = items.find(it => it.data.dateAdded)!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMDATEADDED.handler(context)())
			.toEqual(makeDNP(sample_item.data.dateAdded, { brackets: true }));
		expect(commands.ZOTEROITEMDATEADDED.handler(context)(false))
			.toEqual(makeDNP(sample_item.data.dateAdded, { brackets: false }));
	});

	test("ZOTEROITEMKEY", () => {
		const sample_item = items.find(it => it.key)!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMKEY.handler(context)())
			.toEqual(sample_item.key);
	});

	test("ZOTEROITEMLINK", () => {
		const sample_item = items[0];
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMLINK.handler(context)())
			.toEqual(getLocalLink(sample_item, { format: "target" }));
		expect(commands.ZOTEROITEMLINK.handler(context)("local"))
			.toEqual(getLocalLink(sample_item, { format: "target" }));
		expect(commands.ZOTEROITEMLINK.handler(context)("web"))
			.toEqual(getWebLink(sample_item, { format: "target" }));
	});

	test("ZOTEROITEMMETADATA", () => {
		const sample_item = items[0];
		const context = mockContext({ item: sample_item, notes: [sampleNote], pdfs: [samplePDF] });

		expect(commands.ZOTEROITEMMETADATA.handler(context)())
			.toEqual(reformatImportableBlocks(
				window.zoteroRoam.getItemMetadata(sample_item, [samplePDF], [sampleNote])
			));
	});

	test("ZOTEROITEMPUBLICATION", () => {
		const sample_item = items.find(it => it.data.publicationTitle)!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMPUBLICATION.handler(context)())
			.toEqual(sample_item.data.publicationTitle);
	});

	test("ZOTEROITEMRELATED", () => {
		const semanticItem = items.find(it => it.data.key == "_SEMANTIC_ITEM_");
		const relatedItem = items.find(it => it.data.key == "PPD648N6")!;
		// getItems() retrieves queries data with an inclusive query,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData(
			["items"],
			(_prev) => ({
				data: items,
				lastUpdated: 9999
			})
		);

		const context = mockContext({ item: semanticItem });

		expect(commands.ZOTEROITEMRELATED.handler(context)())
			.toEqual("[[@" + relatedItem.key + "]]");
		expect(commands.ZOTEROITEMRELATED.handler(context)(true))
			.toEqual("[[@" + relatedItem.key + "]]");
		expect(commands.ZOTEROITEMRELATED.handler(context)(false))
			.toEqual(relatedItem.key);	

	});

	test("ZOTEROITEMTAGS", () => {
		const sample_item = items.find(it => it.data.tags.length > 0)!;
		const context = mockContext({ item: sample_item });
	
		expect(commands.ZOTEROITEMTAGS.handler(context)())
			.toEqual(sample_item.data.tags.map(t => `#[[${t.tag}]]`).join(", "));
		expect(commands.ZOTEROITEMTAGS.handler(context)(true))
			.toEqual(sample_item.data.tags.map(t => `#[[${t.tag}]]`).join(", "));
		expect(commands.ZOTEROITEMTAGS.handler(context)(false))
			.toEqual(sample_item.data.tags.map(t => t.tag).join(", "));
	});

	test("ZOTEROITEMTITLE", () => {
		const sample_item = items.find(it => it.data.title)!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMTITLE.handler(context)())
			.toEqual(sample_item.data.title);
	});

	test("ZOTEROITEMTYPE", () => {
		const sample_item = items.find(it => it.data.itemType)!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMTYPE.handler(context)())
			.toEqual(window.zoteroRoam.getItemType(sample_item, { brackets: true }));
		expect(commands.ZOTEROITEMTYPE.handler(context)(true))
			.toEqual(window.zoteroRoam.getItemType(sample_item, { brackets: true }));
		expect(commands.ZOTEROITEMTYPE.handler(context)(false))
			.toEqual(window.zoteroRoam.getItemType(sample_item, { brackets: false }));
	});

	test("ZOTEROITEMURL", () => {
		const sample_item = items.find(it => it.data.url)!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMURL.handler(context)())
			.toEqual(sample_item.data.url);
	});

	test("ZOTEROITEMYEAR", () => {
		const sample_item = items.find(it => it.meta.parsedDate)!;
		const context = mockContext({ item: sample_item });

		expect(commands.ZOTEROITEMYEAR.handler(context)())
			.toEqual((new Date(sample_item.meta.parsedDate)).getUTCFullYear().toString());
	});

	test("ZOTERONOTES", () => {
		const sample_notes = [sampleNote];
		const context = mockContext({ notes: sample_notes });
		const empty_context = mockContext({});

		expect(commands.ZOTERONOTES.handler(context)())
			.toEqual(reformatImportableBlocks(
				window.zoteroRoam.formatNotes(sample_notes)
			));
		expect(commands.ZOTERONOTES.handler(empty_context)())
			.toEqual(reformatImportableBlocks(
				window.zoteroRoam.formatNotes([])
			));
	});

	test("ZOTEROPDFS", () => {
		const sample_pdfs = [samplePDF];
		const context = mockContext({ pdfs: sample_pdfs });
		const empty_context = mockContext({ pdfs: undefined });

		expect(commands.ZOTEROPDFS.handler(context)())
			.toEqual(window.zoteroRoam.formatPDFs(sample_pdfs, "string"));
		expect(commands.ZOTEROPDFS.handler(empty_context)())
			.toEqual(window.zoteroRoam.formatPDFs([], "string"));
	});

});
