import { DBSchema, IDBPDatabase, StoreKey, StoreNames, StoreValue, deleteDB, openDB } from "idb";
import { PersistedClient } from "@tanstack/react-query-persist-client";

import { getGraphName } from "@services/roam";

import { IDB_DATABASE_NAME, IDB_DATABASE_VERSION, IDB_REACT_QUERY_STORE_NAME } from "../../constants";
import { AsBoolean } from "Types/helpers";


const STORE_NAMES: StoreName[] = [
	IDB_REACT_QUERY_STORE_NAME
];

interface Schema extends DBSchema {
	[IDB_REACT_QUERY_STORE_NAME]: {
		key: string,
		value: PersistedClient | undefined
	}
}

type StoreName = StoreNames<Schema>;


/**
 * Opens the extension's interface with IndexedDB. This is the basis for managing local caching with React Query.
 */
class IDBDatabaseService {
	private connection: Promise<IDBPDatabase<Schema>>;
	private dbName: string;

	constructor(){
		let graphName = "";
		try {
			graphName = getGraphName();
		} catch(_e){
			// Do nothing
		}

		const dbName = [IDB_DATABASE_NAME, graphName].filter(AsBoolean).join("_");

		this.dbName = dbName;
		this.connection = openDB<Schema>(this.dbName, IDB_DATABASE_VERSION, {
			upgrade: (database, _oldVersion, _newVersion, _transaction) => {
				STORE_NAMES.forEach((storeName) => database.createObjectStore(storeName));
			},
			blocking: () => {
				console.log(`${this.dbName} - Connection is blocking another, will close`);
				this.connection
					.then((conn) => conn.close())
					.then(() => console.log(`${this.dbName} - Connection successfully closed`));
			},
			blocked: () => {
				console.log(`${this.dbName} - Connection blocked by another`);
			}
		});
	}

	/** Closes the connection to the database. This allows proper teardown in some tests.
	*/
	async close() {
		(await this.connection).close();
	}

	/** Deletes the database from memory. */
	async deleteSelf(){
		try {
			return await deleteDB(this.dbName, {
				blocked: () => {
					console.log(`${this.dbName} - Database deletion is blocked`);
				}
			});
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * Returns handlers for interaction with a store in the database.
	 * @param storeName - The name of the targeted store
	 */
	async selectStore<T extends StoreName>(storeName: T) {
		const conn = await this.connection;
		return {
			async get(key: StoreKey<Schema, T>) {
				return await conn.get(storeName, key);
			},
			async set(key: StoreKey<Schema, T>, value: StoreValue<Schema, T>){
				return await conn.put(storeName, value, key);
			},
			async delete(key: StoreKey<Schema, T>){
				return await conn.delete(storeName, key);
			},
			async clear(){
				return await conn.clear(storeName);
			}
		};
	}
}

export default IDBDatabaseService;