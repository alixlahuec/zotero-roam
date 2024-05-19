import "fake-indexeddb/auto";
import { waitFor } from "@testing-library/dom";
import { PersistedClient } from "@tanstack/query-persist-client-core";

import IDBDatabaseService from ".";
import { IDB_REACT_QUERY_STORE_NAME, IDB_REACT_QUERY_CLIENT_KEY, IDB_DATABASE_VERSION } from "../../constants";


beforeEach(() => {
	global.indexedDB = new IDBFactory();
});


test("Store handling", async () => {
	const idbInstance = new IDBDatabaseService();
	const reactQueryStore = await idbInstance.selectStore(IDB_REACT_QUERY_STORE_NAME);

	const mockClient: PersistedClient = {
		timestamp: 0,
		buster: "",
		clientState: {
			mutations: [],
			queries: []
		}
	};

	await reactQueryStore.set(IDB_REACT_QUERY_CLIENT_KEY, mockClient);		
	let storedClient = await reactQueryStore.get(IDB_REACT_QUERY_CLIENT_KEY);
	expect(storedClient).toMatchObject<PersistedClient>(mockClient);

	await reactQueryStore.delete(IDB_REACT_QUERY_CLIENT_KEY);
	storedClient = await reactQueryStore.get(IDB_REACT_QUERY_CLIENT_KEY);
	expect(storedClient).toBeUndefined();

	await reactQueryStore.set(IDB_REACT_QUERY_CLIENT_KEY, mockClient);
	storedClient = await reactQueryStore.get(IDB_REACT_QUERY_CLIENT_KEY);
	expect(storedClient).toMatchObject<PersistedClient>(mockClient);

	await reactQueryStore.clear();
	storedClient = await reactQueryStore.get(IDB_REACT_QUERY_CLIENT_KEY);
	expect(storedClient).toBeUndefined();

	await waitFor(() => {
		/* eslint-disable-next-line dot-notation */
		indexedDB.deleteDatabase(idbInstance["dbName"]);
	}, { timeout: 500 });

});


test("DB creation", async () => {
	const idbInstance = new IDBDatabaseService();

	await waitFor(async () => {
		const databasesList = await indexedDB.databases();
		expect(databasesList).toEqual([
			{
				/* eslint-disable-next-line dot-notation */
				name: idbInstance["dbName"],
				version: IDB_DATABASE_VERSION
			}
		]);
	}, { timeout: 500 });

	await waitFor(() => {
		/* eslint-disable-next-line dot-notation */
		indexedDB.deleteDatabase(idbInstance["dbName"]);
	}, { timeout: 500 });
});


test("DB deletion", async () => {
	const idbInstance = new IDBDatabaseService();

	await idbInstance.close();
	await idbInstance.deleteSelf();

	await waitFor(async () => {
		const databasesList = await indexedDB.databases();
		expect(databasesList).toEqual([]);
	}, { timeout: 500 });
});


test("DB conflict", async () => {
	const idbInstance1 = new IDBDatabaseService();
	const idbInstance2 = new IDBDatabaseService();

	const reactQueryStore1 = await idbInstance1.selectStore(IDB_REACT_QUERY_STORE_NAME);
	const reactQueryStore2 = await idbInstance2.selectStore(IDB_REACT_QUERY_STORE_NAME);

	reactQueryStore1.get(IDB_REACT_QUERY_CLIENT_KEY);
	reactQueryStore2.clear();

	await waitFor(async () => {
		await idbInstance2.deleteSelf();
	}, { timeout: 500 });
});
