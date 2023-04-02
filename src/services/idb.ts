/* istanbul ignore file */
import { IDBPDatabase, deleteDB, openDB } from "idb";
import { PersistedClient } from "@tanstack/react-query-persist-client";
import { getGraphName } from "Roam";
import { IDB_DATABASE_NAME, IDB_DATABASE_VERSION, IDB_REACT_QUERY_STORE_NAME } from "../constants";


const STORE_NAMES = [
	IDB_REACT_QUERY_STORE_NAME
] as const;

// ! This should extend DBSchema, but with current idb version that would cause a typecheck failure because of the KnownKeys generic.
// TODO: Check if idb dependency can be updated to 6.1.0 +, where the issue has been fixed
interface Schema /* extends DBSchema */{
	[IDB_REACT_QUERY_STORE_NAME]: {
		key: string,
		value: PersistedClient
	}
}

/**
 * Opens the extension's interface with IndexedDB. This is the basis for managing local caching with React Query.
 */
class IDBDatabase {
	#db: Promise<IDBPDatabase<Schema>>;
	#dbName: string;

	constructor(){
		let graphName = "";
		try {
			graphName = getGraphName();
		} catch(_e){
			// Do nothing
		}

		const dbName = [IDB_DATABASE_NAME, graphName].filter(Boolean).join("_");

		this.#dbName = dbName;
		this.#db = openDB<Schema>(this.#dbName, IDB_DATABASE_VERSION, {
			upgrade: (database, _oldVersion, _newVersion, _transaction) => {
				STORE_NAMES.forEach((storeName) => database.createObjectStore(storeName));
			},
			blocking: () => {
				console.log(`${this.#dbName} - Connection is blocking another, will close`);
				this.#db
					.then((db) => db.close())
					.then(() => console.log(`${this.#dbName} - Connection successfully closed`));
			},
			blocked: () => {
				console.log(`${this.#dbName} - Connection blocked by another`);
			}
		});
	}

	/** Deletes the database from memory.
	 * @returns 
	 */
	async deleteSelf(){
		try {
			return await deleteDB(this.#dbName, {
				blocked: () => {
					console.log(`${this.#dbName} - Database deletion is blocked`);
				}
			});
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * Returns handlers for interaction with a store in the database.
	 * @param {String} storeName - The name of the targeted store
	 * @returns
	 */
	selectStore<T extends keyof Schema>(storeName: T){
		return {
			async get(key: Schema[T]["key"]): Promise<Schema[T]["value"]>{
				return (await this.#db).get(storeName, key);
			},
			async set(key: Schema[T]["key"], value: Schema[T]["value"]){
				return (await this.#db).put(storeName, value, key);
			},
			async delete(key: Schema[T]["key"]){
				return (await this.#db).delete(storeName, key);
			},
			async clear(){
				return (await this.#db).clear(storeName);
			}
		};
	}
}

export default IDBDatabase;