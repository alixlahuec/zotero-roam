import { QueryClient } from "@tanstack/query-core";

import { ZoteroAPI, fetchBibEntries, fetchBibliography } from "@clients/zotero";
import IDBDatabase from "@services/idb";
import { SelectItemCollectionsOptions, SelectItemRelatedOptions, SelectItemsOption, selectCollections, selectItemChildren, selectItemCollections, selectItemRelated, selectItems, selectTags } from "@services/react-query";

import { cleanBibliographyHTML, formatItemMetadata, formatNotes, formatPDFs, getItemCreators, getItemDateAdded, getItemLink, getItemPublication, getItemTags, getItemType, groupCitekeysByLibrary } from "./helpers";
import { Logger } from "./logging";

import { cleanError } from "../utils";

import { IDB_REACT_QUERY_CLIENT_KEY, IDB_REACT_QUERY_STORE_NAME } from "../constants";
import { ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "Types/transforms";
import { UserRequests, UserSettings } from "Types/extension";


type ZoteroRoamConstructorArgs = {
	idbDatabase?: IDBDatabase | null,
	queryClient: QueryClient,
	requests: UserRequests,
	settings: UserSettings
};

/**
 * Creates a new public API instance for the extension. This is meant to make available an interface for users as well as other plugins to consume some of the extension's data and functionalities, in a controlled manner. Updates to settings are done by the relevant widgets.
 */
export default class ZoteroRoam extends Logger {
	#db: IDBDatabase | null;
	#libraries: UserRequests["libraries"];
	#queryClient: QueryClient;
	#settings: Pick<UserSettings, "annotations" | "notes" | "typemap" >;

	constructor({ idbDatabase = null, queryClient, requests, settings }: ZoteroRoamConstructorArgs) {
		super()

		const { libraries } = requests;
		const { annotations, notes, typemap } = settings;

		this.#db = idbDatabase;
		this.#libraries = libraries;
		this.#queryClient = queryClient;
		this.#settings = { annotations, notes, typemap };

	}

	/** Clears the contents of the React Query store from the database. */
	async clearDataCache(): Promise<void>{
		if(this.#db !== null){
			try {
				const reactQueryStore = await this.#db.selectStore(IDB_REACT_QUERY_STORE_NAME);
				await reactQueryStore.clear();
				this.info({
					origin: "Database",
					message: "Successfully cleared data from cache",
					showToaster: 1000
				});
			} catch(e){
				this.error({
					origin: "Database",
					message: "Failed to clear data from cache",
					context: {
						error: cleanError(e)
					}
				});
			}
		}
	}

	/** Deletes the database, if any */
	async deleteDatabase(): Promise<void>{
		if(this.#db){
			await this.#db.deleteSelf();
		}
	}

	/** Checks if there is a cached version of the React Query client */
	async isDataCached(): Promise<boolean>{
		if(this.#db !== null){
			try {
				const reactQueryStore = await this.#db.selectStore(IDB_REACT_QUERY_STORE_NAME);
				const cachedClient = await reactQueryStore.get(IDB_REACT_QUERY_CLIENT_KEY);
				return cachedClient !== undefined;
			} catch(e) {
				this.error({
					origin: "Database",
					message: "Failed to obtain caching status",
					context: {
						error: cleanError(e)
					}
				});

				return false;
			}
		}

		return false;
	}

	/** Retrieves the timestamp when the React Query client was last persisted to cache. */
	async getDataCacheUpdatedAt(){
		if(this.#db){
			try {
				const reactQueryStore = await this.#db.selectStore(IDB_REACT_QUERY_STORE_NAME);
				const { timestamp } = await reactQueryStore.get(IDB_REACT_QUERY_CLIENT_KEY) || {};
				return timestamp;
			} catch(e){
				this.error({
					origin: "Database",
					message: "Failed to retrieve cache age",
					context: {
						error: cleanError(e)
					}
				});
			}
		}
		return null;
	}

	// To be called in the RequestsWidget
	/* istanbul ignore next */
	updateLibraries(val: UserRequests["libraries"]) {
		this.#libraries = val;
	}

	/* istanbul ignore next */
	updateSetting<T extends "annotations" | "notes" | "typemap">(op: T, val: UserSettings[T]) {
		this.#settings[op] = val;
	}

	formatPDFs = formatPDFs;
	getItemCreators = getItemCreators;
	getItemDateAdded = getItemDateAdded;
	getItemLink = getItemLink;
	getItemPublication = getItemPublication;
	getItemTags = getItemTags;

	/** Formats Zotero notes and annotations, with current user settings */
	formatNotes(notes: (ZItemNote | ZItemAnnotation)[]) {
		return formatNotes(notes, null, {
			annotationsSettings: this.#settings.annotations,
			notesSettings: this.#settings.notes
		});
	}

	/** Retrieves the bibliographic entries for a list of items */
	async getBibEntries(citekeys: string[]) {
		const items = selectItems("items", {}, {
			queryClient: this.#queryClient
		});

		const groupedList = groupCitekeysByLibrary(citekeys, { items })
		const bibEntries: Promise<string>[] = [];
		Object.keys(groupedList).forEach(libPath => {
			const library = this.#libraries.find(lib => lib.path == libPath);
			if (library) {
				bibEntries.push(fetchBibEntries(groupedList[libPath], library));
			}
		});

		const bibOutput = await Promise.all(bibEntries);
		return bibOutput.join("\n");
	}

	/** Retrieves the formatted bibliography for a given item, with optional config */
	async getItemCitation(item: ZItemTop, config: Partial<ZoteroAPI.Requests.BibliographyArgs> = {}) {
		const location = item.library.type + "s/" + item.library.id;
		const library = this.#libraries.find(lib => lib.path == location)!;

		const bib = await fetchBibliography(item.data.key, library, config);
		return cleanBibliographyHTML(bib);
	}

	/** Retrieves the list of collections for a given library */
	getCollections(path: string) {
		const library = this.#libraries.find(lib => lib.path == path)!;
		return selectCollections(library, {
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the children for a given item */
	getItemChildren(item: ZItemTop) {
		return selectItemChildren(item, {
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the list of collections for a given item */
	getItemCollections(
		item: ZItemTop, { return_as = "string", brackets = true }: Partial<SelectItemCollectionsOptions> = {}
	) {
		return selectItemCollections(item, { return_as, brackets }, {
			libraries: this.#libraries,
			queryClient: this.#queryClient
		});
	}

	/* istanbul ignore next */
	/** Formats an item's metadata into Roam blocks */
	getItemMetadata(item: ZItemTop, pdfs: ZItemAttachment[], notes: (ZItemNote | ZItemAnnotation)[]) {
		return formatItemMetadata(item, pdfs, notes, {
			annotationsSettings: this.#settings.annotations,
			notesSettings: this.#settings.notes,
			typemap: this.#settings.typemap
		});
	}

	/** Retrieves the in-library relations for a given item */
	getItemRelated(
		item: ZItemTop, { return_as = "string", brackets = true }: Partial<SelectItemRelatedOptions> = {}
	) {
		return selectItemRelated(item, { return_as, brackets }, {
			queryClient: this.#queryClient
		})
	}

	/** Retrieves an item's type */
	getItemType(item: ZItemTop, { brackets = true }: { brackets?: boolean } = {}) {
		return getItemType(item, { brackets }, {
			typemap: this.#settings.typemap
		});
	}

	/** Retrieves all / a subset of all items currently available to the extension 
     * @example
     * // Returns the full list of items currently loaded
     * .getItems("all")
     * // Returns all items currently loaded, except for annotations, notes, and attachments
     * .getItems("items")
     */
	getItems(select: SelectItemsOption = "all") {
		return selectItems(select, {}, {
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the map of tags for a given library
     * @example
     * // Returns the map of tags for the library of user ID 123456 
     * .getTags("users/123456")
     */
	getTags(path: string) {
		return selectTags(path, {
			libraries: this.#libraries,
			queryClient: this.#queryClient
		});
	}
}
