import { QueryClient } from "@tanstack/query-core";
import { persistQueryClientSave } from "@tanstack/query-persist-client-core";
import { waitFor } from "@testing-library/dom";
import "fake-indexeddb/auto";
import { mock } from "vitest-mock-extended";

import IDBDatabaseService from "@services/idb";

import ZoteroRoam from ".";
import { cleanBibliographyHTML, formatNotes, formatPDFs, getItemCreators, getItemDateAdded, getItemTags } from "./helpers";

import { createPersisterWithIDB, setupInitialSettings } from "../setup";
import { getLocalLink, getWebLink } from "../utils";

import { bibs, findBibliographyEntry, entries, findItems, items, apiKeys, libraries, sampleAnnot, sampleNote, samplePDF } from "Mocks";

import { UserRequests, UserSettings } from "Types/extension";
import { ZItem, ZItemTop } from "Types/transforms";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const initSettings = setupInitialSettings({});


describe("Formatting utils", () => {
	const extension = new ZoteroRoam({
		queryClient: new QueryClient(),
		requests: mock<UserRequests>({ libraries: [] }),
		settings: initSettings
	});
    
	test("formatNotes", () => {
		expect(extension.formatNotes([sampleNote, sampleAnnot]))
			.toEqual(formatNotes([sampleNote, sampleAnnot], null, { annotationsSettings: initSettings.annotations, notesSettings: initSettings.notes }));
		expect(extension.formatNotes([]))
			.toEqual([]);

	});

	test("formatPDFs", () => {
		expect(extension.formatPDFs([samplePDF]))
			.toEqual(formatPDFs([samplePDF], "string"));
		expect(extension.formatPDFs([]))
			.toEqual("");
	});

	test("getItemDateAdded", () => {
		const date = new Date(2022, 0, 1).toString();
		const mockItem = mock<ZItem>({ data: { dateAdded: date } });

		expect(extension.getItemDateAdded(mockItem))
			.toEqual(getItemDateAdded(mockItem, { brackets: true }));
	});

	test("getItemLink", () => {
		const mockItem = mock<ZItemTop>();
		expect(extension.getItemLink(mockItem, "local"))
			.toBe(getLocalLink(mockItem));
		expect(extension.getItemLink(mockItem, "web"))
			.toBe(getWebLink(mockItem));
	});

	describe("getItemPublication", () => {
		const makeMock = (itemData: Partial<ZItemTop["data"]>) => mock<ZItemTop>({ data: { ...itemData } });
		const cases = [
			[{ publicationTitle: "some publication", bookTitle: undefined, university: undefined }, "some publication"],
			[{ publicationTitle: undefined, bookTitle: "some book", university: undefined }, "some book"],
			[{ publicationTitle: undefined, bookTitle: undefined, university: "some university" }, "some university"],
			[{ publicationTitle: undefined, bookTitle: undefined, university: undefined }, ""]
		] as const;
    
		test.each(cases)(
			"%# - no brackets",
			(itemData, expectation) => {
				const mockItem = makeMock(itemData);
				expect(extension.getItemPublication(mockItem, { brackets: false }))
					.toBe(expectation);
			}
		);
    
		test.each(cases)(
			"%# - with brackets",
			(itemData, expectation) => {
				const mockItem = makeMock(itemData);
				expect(extension.getItemPublication(mockItem))
					.toBe(expectation ? `[[${expectation}]]` : "");
			}
		);
	});
    
	describe("Retrieving the formatted type for an item", () => {
		const cases = [
			[{ itemType: "journalArticle" }, {}, "[[Article]]"],
			[{ itemType: "bookSection" }, { brackets: false }, "Chapter"]
		] as const;

		test.each(cases)(
			"%#",
			(itemData, config, expectation) => {
				const mockItem = mock<ZItemTop>({ data: { ...itemData } });
				expect(extension.getItemType(mockItem, config))
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
			requests: mock<UserRequests>({
				libraries: Object.values(libraries).map(lib => ({ apikey: masterKey, path: lib.path }))
			}),
			settings: mock<UserSettings>()
		}); 
	});

	test("Retrieving creators data for an item", () => {
		const sample_item = items.find(it => it.data.creators.length > 0)!;
		expect(extension.getItemCreators(sample_item, {}))
			.toEqual(getItemCreators(sample_item, {}));
	});

	test("Retrieving tags data for an item", () => {
		const sample_item = items.find(it => it.data.tags.length > 0)!;
		expect(extension.getItemTags(sample_item, {}))
			.toEqual(getItemTags(sample_item, {}));
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

});

describe("Database connectivity", () => {
	const client = new QueryClient();
	const date = new Date(2021, 4, 6);
	const extensionRequests = mock<UserRequests>({ libraries: [] });

	let extension: ZoteroRoam;
	let idbInstance: IDBDatabaseService;

	beforeEach(() => {
		idbInstance = new IDBDatabaseService();
		extension = new ZoteroRoam({
			idbDatabase: idbInstance,
			queryClient: client,
			requests: extensionRequests,
			settings: initSettings
		});

		vi.useFakeTimers()
			.setSystemTime(date);
	});

	afterEach(async () => {
		/* eslint-disable-next-line dot-notation */
		await waitFor(() => indexedDB.deleteDatabase(idbInstance["dbName"]), { timeout: 5000 });
		vi.useRealTimers();
	});

	it("can manage the cache", async () => {
		const infoLogger = vi.spyOn(extension, "info");

		// Simulate behavior of the React Query provider
		persistQueryClientSave({
			queryClient: client,
			persister: createPersisterWithIDB(idbInstance)
		});

		let clientIsCached = await extension.isDataCached();
		expect(clientIsCached).toBe(true);

		const lastCachedTimestamp = await extension.getDataCacheUpdatedAt();
		expect(lastCachedTimestamp).toBe(date.valueOf());

		await extension.clearDataCache();

		expect(infoLogger).toHaveBeenCalledTimes(1);
		expect(infoLogger).toHaveBeenCalledWith({
			origin: "Database",
			message: "Successfully cleared data from cache",
			showToaster: 1000
		});

		clientIsCached = await extension.isDataCached();
		expect(clientIsCached).toBe(false);
	
	});

	it("can delete the database", async () => {
		await extension.deleteDatabase();

		await waitFor(async () => {
			const databasesList = await indexedDB.databases();
			expect(databasesList).toEqual([]);
		}, { timeout: 500 });
	});

});

describe("isDataCached", () => {
	const extensionRequests = mock<UserRequests>({ libraries: [] });

	it("returns false when no data has been persisted yet", async() => {
		const idbInstance = new IDBDatabaseService();
		const client = new QueryClient();
		const extension = new ZoteroRoam({
			idbDatabase: idbInstance,
			queryClient: client,
			requests: extensionRequests,
			settings: initSettings
		});

		const clientIsCached = await extension.isDataCached();
		expect(clientIsCached).toBe(false);

		/* eslint-disable-next-line dot-notation */
		await waitFor(() => indexedDB.deleteDatabase(idbInstance["dbName"]), { timeout: 5000 });
	});

	it("returns true when data has been persisted", async () => {
		const idbInstance = new IDBDatabaseService();
		const client = new QueryClient();
		const extension = new ZoteroRoam({
			idbDatabase: idbInstance,
			queryClient: client,
			requests: extensionRequests,
			settings: initSettings
		});

		// Simulate behavior of the React Query provider
		persistQueryClientSave({
			queryClient: client,
			persister: createPersisterWithIDB(idbInstance)
		});

		const clientIsCached = await extension.isDataCached();
		expect(clientIsCached).toBe(true);

		/* eslint-disable-next-line dot-notation */
		await waitFor(() => indexedDB.deleteDatabase(idbInstance["dbName"]), { timeout: 5000 });
	});

	it("returns false when there is no database", async() => {
		const client = new QueryClient();
		const extension = new ZoteroRoam({
			queryClient: client,
			requests: extensionRequests,
			settings: initSettings
		});
	
		const clientIsCached = await extension.isDataCached();
		expect(clientIsCached).toBe(false);
	});

});

describe("Error logging when the database no longer exists", () => {
	const extensionRequests = mock<UserRequests>({ libraries: [] });

	let client: QueryClient;
	let extension: ZoteroRoam;
	let idbInstance: IDBDatabaseService;

	beforeEach(async () => {
		client = new QueryClient();
		idbInstance = new IDBDatabaseService();
		extension = new ZoteroRoam({
			idbDatabase: idbInstance,
			queryClient: client,
			requests: extensionRequests,
			settings: initSettings
		});

		/* eslint-disable-next-line dot-notation */
		await waitFor(async () => {
			await idbInstance.close();
			await extension.deleteDatabase();
		}, { timeout: 500 });
	});


	it("handles attempting to clear the React Query store", async () => {
		const errorLogger = vi.spyOn(extension, "error");

		await extension.clearDataCache();

		expect(errorLogger).toHaveBeenCalledTimes(1);
		expect(errorLogger).toHaveBeenCalledWith(
			expect.objectContaining({
				origin: "Database",
				message: "Failed to clear data from cache"
			})
		);

	});


	it("handles attempting to check if there is cached data", async () => {
		const errorLogger = vi.spyOn(extension, "error");
	
		const res = await extension.isDataCached();

		expect(res).toBe(false);
		expect(errorLogger).toHaveBeenCalledTimes(1);
		expect(errorLogger).toHaveBeenCalledWith(
			expect.objectContaining({
				origin: "Database",
				message: "Failed to obtain caching status"
			})
		);

	});


	it("handles attempting to fetch the timestamp for the last caching operation", async () => {
		const errorLogger = vi.spyOn(extension, "error");

		await extension.getDataCacheUpdatedAt();

		expect(errorLogger).toHaveBeenCalledTimes(1);
		expect(errorLogger).toHaveBeenCalledWith(
			expect.objectContaining({
				origin: "Database",
				message: "Failed to retrieve cache age"
			})
		);
	});
});