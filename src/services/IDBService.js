/* istanbul ignore file */
import { openDB } from "idb";


class IDBService {
	/** @private */
	#db;
	/** @private */
	#storeName;

	/**
	 * @param {{
	 * dbName: String,
	 * dbVersion: Number
	 * }} context - The context in which the instance is being created
	 */
	constructor({ dbName, dbVersion, storeName }){
		this.#storeName = storeName;
		this.#db = openDB(dbName, dbVersion, {
			upgrade: (database, _oldVersion, _newVersion, _transaction) => {
				database.createObjectStore(this.#storeName);
			}
		});
	}
	async get(key){
		return (await this.#db).get(this.#storeName, key);
	}

	async set(key, value) {
		return (await this.#db).put(this.#storeName, value, key);
	}

	async delete(key) {
		return (await this.#db).delete(this.#storeName, key);
	}

	async clear() {
		return (await this.#db).clear(this.#storeName);
	}
}

export default IDBService;