/* istanbul ignore file */
import { openDB } from "idb";
import { IDB_DATABASE_NAME, IDB_DATABASE_VERSION, IDB_REACT_QUERY_STORE_NAME } from "../constants";


const STORE_NAMES = [
	IDB_REACT_QUERY_STORE_NAME
];

/**
 * Opens the extension's interface with IndexedDB. This is the basis for managing caching and persistence with React Query.
 */
class IDBDatabase {
	/** @private */
	#db;

	constructor(){
		this.#db = openDB(IDB_DATABASE_NAME, IDB_DATABASE_VERSION, {
			upgrade: (database, _oldVersion, _newVersion, _transaction) => {
				STORE_NAMES.forEach((storeName) => database.createObjectStore(storeName));
			}
		});
	}

	/**
	 * Returns handlers for interaction with a store in the database.
	 * @param {String} storeName - The name of the targeted store
	 * @returns
	 */
	selectStore(storeName){
		return {
			get: async(key) => {
				return (await this.#db).get(storeName, key);
			},
			set: async(key, value) => {
				return (await this.#db).put(storeName, value, key);
			},
			delete: async(key) => {
				return (await this.#db).delete(storeName, key);
			},
			clear: async() => {
				return (await this.#db).clear(storeName);
			}
		};
	}
}

export default IDBDatabase;