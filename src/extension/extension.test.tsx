import { QueryClient } from "@tanstack/query-core";

import { H5 } from "@blueprintjs/core";
import { analyzeUserRequests, setupInitialSettings } from "../setup";
import { _formatPDFs, _getItemCreators, _getItemTags } from "../public";
import { cleanBibliographyHTML, makeTagList } from "../api/utils";
import { formatItemAnnotations, formatItemNotes, getLocalLink, getWebLink } from "../utils";

import ZoteroRoam, { ZoteroRoamLog, _formatNotes } from ".";
import zrToaster from "Components/ExtensionToaster";

import { bibs, findBibliographyEntry } from "Mocks/zotero/bib";
import { entries, findItems, items } from "Mocks/zotero/items";
import { apiKeys } from "Mocks/zotero/keys";
import { findCollections } from "Mocks/zotero/collections";
import { libraries } from "Mocks/zotero/libraries";
import { sampleAnnot, sampleAnnotLaterPage, sampleAnnotPrevPage } from "Mocks/zotero/annotations";
import { sampleNote, sampleOlderNote } from "Mocks/zotero/notes";
import { samplePDF } from "Mocks/zotero/pdfs";
import { tags } from "Mocks/zotero/tags";
import { existing_block_uid, existing_block_uid_with_children, uid_with_existing_block, uid_with_existing_block_with_children } from "Mocks/roam";
import { QueryDataItems } from "Types/transforms";
import { Mocks } from "Mocks/types";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary, groupLibrary } = libraries;
const defaultReqs = [
	{ dataURI: userLibrary.path + "/items", apikey: masterKey, name: "My user library" },
	{ dataURI: groupLibrary.path + "/items", apikey: masterKey, name: "My group library" }
];

const initRequests = analyzeUserRequests(defaultReqs);
const initSettings = setupInitialSettings({});


describe("Formatting utils", () => {
	const extension = new ZoteroRoam({
		queryClient: new QueryClient(),
		requests: initRequests,
		settings: initSettings
	});
    
	describe("Notes & Annotations formatting", () => {
		afterEach(() => {
			// Reset the notes settings each time
			extension.updateSetting("notes", initSettings.notes);
		});

		test("Class method returns correct output", () => {
			expect(extension.formatNotes([sampleNote, sampleAnnot]))
				.toEqual(_formatNotes([sampleNote, sampleAnnot], null, { annotationsSettings: initSettings.annotations, notesSettings: initSettings.notes }));
			expect(extension.formatNotes([]))
				.toEqual([]);
		});

		test("Sorted output", () => {
			extension.updateSetting("notes", {
				...initSettings.notes,
				nest_preset: false,
				nest_use: "preset"
			});

			expect(extension.formatNotes([sampleAnnotLaterPage, sampleAnnotPrevPage]))
				.toEqual([
					...formatItemAnnotations([sampleAnnotPrevPage]),
					...formatItemAnnotations([sampleAnnotLaterPage])
				]);
		
			expect(extension.formatNotes([sampleNote, sampleOlderNote]))
				.toEqual([
					...formatItemNotes([sampleOlderNote]),
					...formatItemNotes([sampleNote])
				]);
			
			expect(extension.formatNotes([sampleNote, sampleAnnotLaterPage, sampleAnnotPrevPage]))
				.toEqual([
					...formatItemAnnotations([sampleAnnotPrevPage]),
					...formatItemAnnotations([sampleAnnotLaterPage]),
					...formatItemNotes([sampleNote])
				]);
		});

		test("Nested output - with preset", () => {
			const preset_string = "[[Notes]]";

			extension.updateSetting("notes", {
				...initSettings.notes,
				nest_preset: preset_string,
				nest_use: "preset"
			});

			expect(extension.formatNotes([sampleNote, sampleOlderNote]))
				.toEqual([
					{
						string: preset_string,
						text: preset_string,
						children: [
							...formatItemNotes([sampleOlderNote]),
							...formatItemNotes([sampleNote])
						]
					}
				]);
		});

		test("Nested output - with custom string", () => {
			const custom_string = "[[My Notes]]";

			extension.updateSetting("notes", {
				...initSettings.notes,
				nest_char: custom_string,
				nest_use: "custom"
			});

			expect(extension.formatNotes([sampleNote, sampleOlderNote]))
				.toEqual([
					{
						string: custom_string,
						text: custom_string,
						children: [
							...formatItemNotes([sampleOlderNote]),
							...formatItemNotes([sampleNote])
						]
					}
				]);
		});

		test("Util returns nested output - with block checking", () => {
			const custom_string = "[[My Notes]]";

			const formattedOutput = formatItemNotes([sampleNote]);

			expect(_formatNotes([sampleNote], uid_with_existing_block, {
				annotationsSettings: initSettings.annotations,
				notesSettings: {
					...initSettings.notes,
					nest_char: custom_string,
					nest_position: "top",
					nest_preset: false,
					nest_use: "custom"
				}
			})).toEqual(
				formattedOutput.map(blck => ({
					string: blck,
					text: blck,
					order: 0,
					parentUID: existing_block_uid
				}))
			);
			
			expect(_formatNotes([sampleNote], uid_with_existing_block_with_children, {
				annotationsSettings: initSettings.annotations,
				notesSettings: {
					...initSettings.notes,
					nest_char: custom_string,
					nest_position: "top",
					nest_preset: false,
					nest_use: "custom"
				}
			})).toEqual(
				formattedOutput.map(blck => ({
					string: blck,
					text: blck,
					order: 0,
					parentUID: existing_block_uid_with_children
				}))
			);

			expect(_formatNotes([sampleNote], "uid without existing block", {
				annotationsSettings: initSettings.annotations,
				notesSettings: {
					...initSettings.notes,
					nest_char: custom_string,
					nest_position: "top",
					nest_preset: false,
					nest_use: "custom"
				}
			})).toEqual([
				{
					string: custom_string,
					text: custom_string,
					children: formattedOutput
				}
			]);

		});

		test("Util returns nested output - with block checking, with position", () => {
			const custom_string = "[[My Notes]]";

			const formattedOutput = formatItemNotes([sampleNote]);

			expect(_formatNotes([sampleNote], uid_with_existing_block, {
				annotationsSettings: initSettings.annotations,
				notesSettings: {
					...initSettings.notes,
					nest_char: custom_string,
					nest_position: "bottom",
					nest_preset: false,
					nest_use: "custom"
				}
			})).toEqual(
				formattedOutput.map(blck => ({
					string: blck,
					text: blck,
					order: 0,
					parentUID: existing_block_uid
				}))
			);

			expect(_formatNotes([sampleNote], uid_with_existing_block_with_children, {
				annotationsSettings: initSettings.annotations,
				notesSettings: {
					...initSettings.notes,
					nest_char: custom_string,
					nest_position: "bottom",
					nest_preset: false,
					nest_use: "custom"
				}
			})).toEqual(
				formattedOutput.map(blck => ({
					string: blck,
					text: blck,
					order: 2,
					parentUID: existing_block_uid_with_children
				}))
			);
		});

	});

	test("PDFs formatting", () => {
		expect(extension.formatPDFs([samplePDF], "links"))
			.toEqual(_formatPDFs([samplePDF], "links"));
		expect(extension.formatPDFs([samplePDF], "identity"))
			.toEqual(_formatPDFs([samplePDF], "identity"));
		expect(extension.formatPDFs([samplePDF], "string"))
			.toEqual(_formatPDFs([samplePDF], "string"));
		expect(extension.formatPDFs([]))
			.toEqual("");
	});

	describe("Retrieving and formatting the date-added property of an item", () => {
		const date = new Date(2022, 0, 1).toString();
		const cases = [
			[
				"with default settings", 
				{},
				"[[January 1st, 2022]]"
			],
			[
				"with no brackets",
				{ brackets: false },
				"January 1st, 2022"
			]
		] as const;

		test.each(cases)(
			"%# - %s",
			(_id, config, expectation) => {
				const sampleItem = items[0];
				expect(extension.getItemDateAdded(
					{ ...sampleItem, data: { ...sampleItem.data, dateAdded: date } },
					config
				)).toBe(expectation);
			}
		);
	});

	test("Retrieving the links to an item", () => {
		const sampleItem = items[0];
		expect(extension.getItemLink(sampleItem, "local"))
			.toBe(getLocalLink(sampleItem));
		expect(extension.getItemLink(sampleItem, "web"))
			.toBe(getWebLink(sampleItem));
	});

	describe("Retrieving publication details for an item", () => {
		const cases = [
			[{ publicationTitle: "some publication", bookTitle: undefined, university: undefined }, "some publication"],
			[{ publicationTitle: undefined, bookTitle: "some book", university: undefined }, "some book"],
			[{ publicationTitle: undefined, bookTitle: undefined, university: "some university" }, "some university"],
			[{ publicationTitle: undefined, bookTitle: undefined, university: undefined }, ""]
		] as const;
    
		test.each(cases)(
			"%# - no brackets",
			(itemData, expectation) => {
				const sampleItem = items[0];
				const item = { ...sampleItem, data: { ...sampleItem.data, ...itemData } };
				expect(extension.getItemPublication(item, { brackets: false }))
					.toBe(expectation);
			}
		);
    
		test.each(cases)(
			"%# - with brackets",
			(itemData, expectation) => {
				const sampleItem = items[0];
				const item = { ...sampleItem, data: { ...sampleItem.data, ...itemData } };
				expect(extension.getItemPublication(item))
					.toBe(expectation ? `[[${expectation}]]` : "");
			}
		);
	});
    
	describe("Retrieving the formatted type for an item", () => {
		const cases = [
			[{ itemType: "journalArticle" }, {}, "[[Article]]"],
			[{ itemType: "journalArticle" }, { brackets: true }, "[[Article]]"],
			[{ itemType: "bookSection" }, { brackets: false }, "Chapter"]
		] as const;

		test.each(cases)(
			"%#",
			(itemData, config, expectation) => {
				const sampleItem = items[0];
				const item = { ...sampleItem, data: { ...sampleItem.data, ...itemData } };
				expect(extension.getItemType(item, config))
					.toBe(expectation);
			}
		);
	});
});

describe("Retrieval utils", () => {
	let client: QueryClient;
	let extension: ZoteroRoam;

	beforeEach(() => {
		client = new QueryClient();
		extension = new ZoteroRoam({
			queryClient: client,
			requests: initRequests,
			settings: initSettings
		}); 
	});

	test("Retrieving children data for an item", () => {
		const targetLibrary = Object.values(libraries).find(lib => lib.type == samplePDF.library.type + "s" && lib.id == samplePDF.library.id)!;
		const parentItem = items.find(it => it.data.key == samplePDF.data.parentItem)!;
		// getItemChildren() retrieves queries data by matching the data URI,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData<QueryDataItems>(
			["items", { dataURI: targetLibrary.path + "/items", library: targetLibrary.path }],
			(_prev) => ({
				data: [parentItem, samplePDF],
				lastUpdated: targetLibrary.version
			})
		);

		expect(extension.getItemChildren(parentItem))
			.toEqual([samplePDF]);
	});

	test("Retrieving collections data for an item", () => {
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

		expect(extension.getItemCollections(sample_item, { return_as: "array", brackets: false }))
			.toEqual(expectedColls);
		expect(extension.getItemCollections(sample_item, { return_as: "array", brackets: true }))
			.toEqual(expectedColls.map(cl => `[[${cl}]]`));
		expect(extension.getItemCollections(sample_item, { return_as: "string", brackets: false }))
			.toEqual(expectedColls.join(", "));
		expect(extension.getItemCollections(sample_item, { return_as: "string", brackets: true }))
			.toEqual(expectedColls.map(cl => `[[${cl}]]`).join(", "));
		expect(extension.getItemCollections(sample_item, {}))
			.toEqual(expectedColls.map(cl => `[[${cl}]]`).join(", "));
        
		const item_without_collections = items.find(it => it.data.collections.length == 0)!;
		expect(extension.getItemCollections(item_without_collections, { brackets: false }))
			.toEqual([]);

	});

	test("Retrieving creators data for an item", () => {
		const sample_item = items.find(it => it.data.creators.length > 0)!;
		expect(extension.getItemCreators(sample_item, {}))
			.toEqual(_getItemCreators(sample_item, {}));
	});

	test("Retrieving relations data for an item", () => {
		const semanticItem = items.find(it => it.data.key == "_SEMANTIC_ITEM_")!;
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

		expect(extension.getItemRelated(semanticItem, { return_as: "array", brackets: false }))
			.toEqual([relatedItem.key]);
		expect(extension.getItemRelated(semanticItem, { return_as: "raw", brackets: false }))
			.toEqual([relatedItem]);
		expect(extension.getItemRelated(semanticItem, { return_as: "string", brackets: false }))
			.toEqual(relatedItem.key);
		expect(extension.getItemRelated(semanticItem, { return_as: "string", brackets: true }))
			.toEqual(`[[@${relatedItem.key}]]`);
		
		// No relations
		const noRelationsItem = items.find(it => JSON.stringify(it.data.relations) == "{}")!;
		expect(extension.getItemRelated(noRelationsItem, { return_as: "array" }))
			.toEqual([]);
		expect(extension.getItemRelated(noRelationsItem, { return_as: "raw" }))
			.toEqual([]);
		expect(extension.getItemRelated(noRelationsItem, { return_as: "string" }))
			.toEqual("");
	});

	test("Retrieving tags data for an item", () => {
		const sample_item = items.find(it => it.data.tags.length > 0)!;
		expect(extension.getItemTags(sample_item, {}))
			.toEqual(_getItemTags(sample_item, {}));
	});

	describe("Retrieving bibliography for an item", () => {
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

		test("It should return the clean bibliography", async() => {
			const sample_bib = bibs.itemInLibrary;
			const { library: { type, id } } = sample_bib;
			const path = type + "s/" + id;
			const itemKey = sample_bib.key;

			const sample_item = findItems({ type: `${type}s`, id, since: 0 }).find(it => it.data.key == itemKey)!;

			const res = await extension.getItemCitation(sample_item, {});

			const { bib } = findBibliographyEntry({ key: itemKey, path });

			expect(res)
				.toEqual(cleanBibliographyHTML(bib));
		});
    
	});

	test("Retrieving bibliographic entries for a list of citekeys", async() => {
		// getItems() retrieves queries data with an inclusive query,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData(
			["items"],
			(_prev) => ({
				data: items,
				lastUpdated: 9999
			})
		);

		const citekeys = Object.keys(entries);
		const expected = Object.values(entries).map(entry => entry.biblatex).join("\n");
    
		const bibEntries = await extension.getBibEntries(citekeys);
    
		expect(bibEntries)
			.toEqual(expected);
	});

	test("Retrieving all items across libraries", () => {
		// getItems() retrieves queries data with an inclusive query,
		// so no need to reproduce the exact query key that would exist in prod
		client.setQueryData(
			["items"],
			(_prev) => ({
				data: [...items, sampleAnnot, sampleNote, samplePDF],
				lastUpdated: 9999
			})
		);

		expect(extension.getItems())
			.toEqual([...items, sampleAnnot, sampleNote, samplePDF]);

		expect(extension.getItems("all"))
			.toEqual([...items, sampleAnnot, sampleNote, samplePDF]);
    
		expect(extension.getItems("annotations"))
			.toEqual([sampleAnnot]);
        
		expect(extension.getItems("attachments"))
			.toEqual([samplePDF]);

		expect(extension.getItems("children"))
			.toEqual([sampleAnnot, sampleNote, samplePDF]);
        
		expect(extension.getItems("items"))
			.toEqual([...items]);
        
		expect(extension.getItems("notes"))
			.toEqual([sampleNote]);

		expect(extension.getItems("pdfs"))
			.toEqual([samplePDF]);
	});

	describe("Retrieving tags data for a library", () => {
		const cases = Object.entries(libraries);

		test.each(cases)(
			"%# Retrieving tags data for %s",
			(_libName, libraryDetails) => {
				const { path, version } = libraryDetails;

				const tagList = makeTagList(tags[path]);

				client.setQueryData(
					["tags", { library: path }],
					(_prev) => ({
						data: tagList,
						lastUpdated: version
					})
				);

				expect(extension.getTags(path))
					.toEqual(tagList);
			}
		);

	});

});

describe("Logger utils", () => {
	let extension: ZoteroRoam;
	const client = new QueryClient();

	beforeAll(() => {
		jest.useFakeTimers()
			.setSystemTime(new Date(2022, 4, 6));
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	beforeEach(() => {
		extension = new ZoteroRoam({
			queryClient: client,
			requests: initRequests,
			settings: initSettings
		}); 
	});

	const log_details = {
		origin: "API",
		message: "Some log",
		detail: "",
		context: {
			text: "string"
		}
	};

	test("Logging error", () => {
		extension.error(log_details);
		expect(extension.logs)
			.toEqual([
				{
					...log_details,
					intent: "danger",
					level: "error",
					timestamp: new Date(2022, 4, 6)
				}
			]);
	});

	test("Logging info", () => {
		extension.info(log_details);
		expect(extension.logs)
			.toEqual([
				{
					...log_details,
					intent: "primary",
					level: "info",
					timestamp: new Date(2022, 4, 6)
				}
			]);
	});

	test("Logging warning", () => {
		extension.warn(log_details);
		expect(extension.logs)
			.toEqual([
				{
					...log_details,
					intent: "warning",
					level: "warning",
					timestamp: new Date(2022, 4, 6)
				}
			]);
	});

});

describe("Custom class for logs", () => {
	beforeAll(() => {
		jest.useFakeTimers()
			.setSystemTime(new Date(2022, 4, 6));
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	test("It uses fallback values", () => {
		const sample_log = new ZoteroRoamLog();

		expect(sample_log)
			.toEqual({
				context: {},
				detail: "",
				intent: "primary",
				level: "info",
				message: "",
				origin: "",
				timestamp: new Date(2022, 4, 6)
			});
	});

	test("It initializes with values provided", () => {
		const sample_log = new ZoteroRoamLog(
			{
				origin: "API",
				message: "Failed to fetch",
				context: {
					text: "some text"
				}
			},
			"error"
		);

		expect(sample_log)
			.toEqual({
				context: {
					text: "some text"
				},
				detail: "",
				intent: "danger",
				level: "error",
				message: "Failed to fetch",
				origin: "API",
				timestamp: new Date(2022, 4, 6)
			});
	});

	test("It calls the toaster when showToaster is provided", () => {
		const showToasterFn = jest.spyOn(zrToaster, "show");

		const log_contents = {
			origin: "Metadata",
			message: "Failed to import metadata for @someCitekey",
			context: {
				text: "some text"
			}
		};

		new ZoteroRoamLog({ ...log_contents }, "error");
		expect(showToasterFn).not.toHaveBeenCalled();

		new ZoteroRoamLog({ ...log_contents, showToaster: 1500 }, "error");
		expect(showToasterFn).toHaveBeenCalled();
		expect(showToasterFn).toHaveBeenCalledWith({
			icon: "warning-sign",
			intent: "danger",
			message: log_contents.message,
			timeout: 1500
		});

		new ZoteroRoamLog({ ...log_contents, showToaster: true }, "warning");
		expect(showToasterFn).toHaveBeenCalledTimes(2);
		expect(showToasterFn).toHaveBeenNthCalledWith(2, {
			icon: "warning-sign",
			intent: "warning",
			message: log_contents.message,
			timeout: 1000
		});
	});

	test("It creates the right message for the toaster", () => {
		const showToasterFn = jest.spyOn(zrToaster, "show");

		new ZoteroRoamLog({
			origin: "Metadata",
			message: "Failed to import metadata for @someCitekey",
			detail: "Function customFunc doesn't exist",
			context: {},
			showToaster: 1000
		}, "error");

		expect(showToasterFn).toHaveBeenCalled();
		expect(showToasterFn).toHaveBeenCalledWith({
			icon: "warning-sign",
			intent: "danger",
			message: (
				<>
					<H5>Failed to import metadata for @someCitekey</H5>
					<p>{"Function customFunc doesn't exist"}</p>
				</>
			),
			timeout: 1000
		});
	});
});