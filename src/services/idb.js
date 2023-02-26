/* istanbul ignore file */
import { deleteDB, openDB } from "idb";
import { getGraphName } from "Roam";
import { IDB_DATABASE_NAME, IDB_DATABASE_VERSION, IDB_REACT_QUERY_STORE_NAME } from "../constants";


const STORE_NAMES = [
	IDB_REACT_QUERY_STORE_NAME
];

/**
 * Opens the extension's interface with IndexedDB. This is the basis for managing local caching with React Query.
 */
class IDBDatabase {
	/** @private */
	#db;
	/** @private */
	#dbName;

	constructor(){
		let graphName = null;
		try {
			graphName = getGraphName();
		} catch(_e){
			// Do nothing
		}

		const dbName = [IDB_DATABASE_NAME, graphName].filter(Boolean).join("_");

		this.#dbName = dbName;
		this.#db = openDB(this.#dbName, IDB_DATABASE_VERSION, {
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