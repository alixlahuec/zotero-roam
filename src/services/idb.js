/* istanbul ignore file */
import { deleteDB, openDB } from "idb";
import { getGraphName } from "Roam";
import { IDB_DATABASE_NAME, IDB_DATABASE_VERSION, IDB_REACT_QUERY_STORE_NAME } from "../constants";


const STORE_NAMES = [
	IDB_REACT_QUERY_STORE_NAME
];

/* istanbul ignore next */
/** Executes type validation against the IDBDatabase constructor
 * @param {*} props - The props passed to the component
 * @param {*} propName - The name of the prop being evaluated
 * @param {*} componentName - The name of the component
 * @returns 
 */
const isIDBDatabase = (props, propName, componentName) => {
	if(!props[propName].constructor === IDBDatabase){
		return new Error(
			`Invalid prop ${propName} passed to ${componentName}. Expected a valid email.`
		);
	}
};

/**
 * Opens the extension's interface with IndexedDB. This is the basis for managing caching and persistence with React Query.
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
			// TODO: check which idb version provides args
			blocking: (_currentVersion, _blockedVersion, event) => {
				const db = event.target.result;
				db.close();
				console.log("ZR - Connection closed to unblock new connection");
			},
			blocked: () => {
				console.log("ZR - Connection blocked by another open connection");
			}
		});
	}

	/** Deletes the database from memory.
	 * @returns 
	 */
	async deleteSelf(){
		try {
			return await deleteDB(this.#dbName, {
				// TODO: check which idb version provides args
				blocked: (_currentVersion, _event) => {
					console.log("ZR - Database deletion is blocked");
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
export { isIDBDatabase };