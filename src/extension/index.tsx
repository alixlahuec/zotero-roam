import { H5, IconName, Intent } from "@blueprintjs/core";
import { Query, QueryClient, QueryFilters } from "@tanstack/query-core";
import zrToaster from "Components/ExtensionToaster";

import { RelatedOptions, _formatPDFs, _getItemCreators, _getItemRelated, _getItemTags } from "../public";
import IDBDatabase from "../services/idb";
import { cleanBibliographyHTML, cleanErrorIfAxios, fetchBibEntries, fetchBibliography } from "../api/utils";
import { compareAnnotationRawIndices, formatZoteroAnnotations, formatZoteroNotes, getLocalLink, getWebLink, makeDNP } from "../utils";
import { findRoamBlock } from "Roam";

import { IDB_REACT_QUERY_CLIENT_KEY, IDB_REACT_QUERY_STORE_NAME } from "../constants";

import { RImportableElement, ZItem, ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop, ZLibrary, QueryDataCollections, QueryDataItems, QueryDataTags, QueryKeyItems, QueryKeyTags, QueryKeyCollections } from "Types/transforms";
import { SettingsAnnotations, SettingsNotes, SettingsTypemap, UserRequests, UserSettings } from "Types/extension";
import { ZoteroAPI } from "Types/externals";


type ZoteroRoamConstructorArgs = {
	idbDatabase?: IDBDatabase | null,
	queryClient: QueryClient,
	requests: UserRequests,
	settings: UserSettings
};

/**
 * Creates a new public API instance for the extension. This is meant to make available an interface for users as well as other plugins to consume some of the extension's data and functionalities, in a controlled manner. Updates to settings are done by the relevant widgets.
 */
export default class ZoteroRoam {
	#db: IDBDatabase | null;
	#libraries: UserRequests["libraries"];
	#queryClient: QueryClient;
	#settings: Pick<UserSettings, "annotations" | "notes" | "typemap" >;
	logs: ZoteroRoamLog[] = [];

	constructor({ idbDatabase = null, queryClient, requests, settings }: ZoteroRoamConstructorArgs) {
		const { libraries } = requests;
		const { annotations, notes, typemap } = settings;

		this.#db = idbDatabase;
		this.#libraries = libraries;
		this.#queryClient = queryClient;
		this.#settings = { annotations, notes, typemap };

	}

	/* istanbul ignore next */
	/** Clears the contents of the React Query store from the database. */
	async clearDataCache(): Promise<void>{
		if(this.#db !== null){
			try {
				await this.#db.selectStore(IDB_REACT_QUERY_STORE_NAME).clear();
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
						error: cleanErrorIfAxios(e)
					}
				});
			}
		}
	}

	/* istanbul ignore next */
	/** Deletes the database, if any */
	async deleteDatabase(): Promise<void>{
		if(this.#db){
			await this.#db.deleteSelf();
		}
	}

	/* istanbul ignore next */
	/** Checks if there is a cached version of the React Query client */
	async isDataCached(): Promise<boolean>{
		if(this.#db !== null){
			try {
				const cachedClient = await this.#db.selectStore(IDB_REACT_QUERY_STORE_NAME).get(IDB_REACT_QUERY_CLIENT_KEY);
				return cachedClient !== undefined;
			} catch(e) {
				this.error({
					origin: "Database",
					message: "Failed to obtain caching status",
					context: {
						error: cleanErrorIfAxios(e)
					}
				});

				return false;
			}
		}

		return false;
	}

	/* istanbul ignore next */
	/** Retrieves the timestamp when the React Query client was last persisted to cache.
	 * @returns {Promise<Number|void>}
	 */
	async getDataCacheUpdatedAt(){
		if(this.#db){
			try {
				const { timestamp } = await this.#db.selectStore(IDB_REACT_QUERY_STORE_NAME).get(IDB_REACT_QUERY_CLIENT_KEY);
				return timestamp;
			} catch(e){
				this.error({
					origin: "Database",
					message: "Failed to retrieve cache age",
					context: {
						error: cleanErrorIfAxios(e)
					}
				});
			}
		}
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

	send(obj: LogConfig, level: LogLevel = "info"){
		this.logs.push(new ZoteroRoamLog(obj, level));
	}

	error(obj: LogConfig){
		this.send(obj, "error");
	}

	info(obj: LogConfig){
		this.send(obj, "info");
	}

	warn(obj: LogConfig){
		this.send(obj, "warning");
	}

	formatPDFs = _formatPDFs;
	getItemCreators = _getItemCreators;
	getItemDateAdded = _getItemDateAdded;
	getItemLink = _getItemLink;
	getItemPublication = _getItemPublication;
	getItemTags = _getItemTags;


	/** Formats Zotero notes and annotations, with current user settings */
	formatNotes(notes: (ZItemNote | ZItemAnnotation)[]) {
		return _formatNotes(notes, null, {
			annotationsSettings: this.#settings.annotations,
			notesSettings: this.#settings.notes
		});
	}

	/** Retrieves the bibliographic entries for a list of items */
	async getBibEntries(citekeys: string[]) {
		return await _getBibEntries(citekeys, {
			libraries: this.#libraries,
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the formatted bibliography for a given item, with optional config */
	async getItemCitation(item: ZItemTop, config: Partial<ZoteroAPI.Requests.BibliographyArgs> = {}) {
		return await _getItemCitation(item, config, {
			libraries: this.#libraries
		});
	}

	/** Retrieves the list of collections for a given library */
	getCollections(path: string) {
		const library = this.#libraries.find(lib => lib.path == path)!;
		return _getCollections(library, {
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the children for a given item */
	getItemChildren(item: ZItemTop) {
		return _getItemChildren(item, {
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the list of collections for a given item */
	getItemCollections(item: ZItemTop, { return_as = "string", brackets = true }: Partial<CollectionOptions> = {},) {
		const path = item.library.type + "s/" + item.library.id;
		const collectionList = this.getCollections(path);

		return _getItemCollections(item, collectionList, { return_as, brackets });
	}

	/* istanbul ignore next */
	/** Formats an item's metadata into Roam blocks */
	getItemMetadata(item: ZItemTop, pdfs: ZItemAttachment[], notes: (ZItemNote | ZItemAnnotation)[]) {
		return _getItemMetadata(item, pdfs, notes, {
			annotationsSettings: this.#settings.annotations,
			notesSettings: this.#settings.notes,
			typemap: this.#settings.typemap
		});
	}

	/** Retrieves the in-library relations for a given item */
	getItemRelated(item: ZItemTop, { return_as = "string", brackets = true }: Partial<RelatedOptions> = {}) {
		const { type: libType, id: libID } = item.library;
		const datastore = this.getItems("items")
			.filter(it => it.library.id == libID && it.library.type == libType);

		return _getItemRelated(item, datastore, { return_as, brackets });
	}

	/** Retrieves an item's type */
	getItemType(item: ZItemTop, { brackets = true }: { brackets?: boolean } = {}) {
		return _getItemType(item, { brackets }, {
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
		return _getItems(select, {}, {
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the map of tags for a given library
     * @example
     * // Returns the map of tags for the library of user ID 123456 
     * .getTags("users/123456")
     */
	getTags(path: string) {
		return _getTags(path, {
			libraries: this.#libraries,
			queryClient: this.#queryClient
		});
	}
}

type LogConfig = {
	context?: Record<string, any>,
	detail?: string,
	origin?: string,
	message?: string,
	showToaster?: number | boolean
};

type LogLevel = "error" | "info" | "warning";

/**
 * Creates a log entry for the extension. This is meant to provide users with information about different events (e.g errors when fetching data), through an optional toast and more detailed logs.
 */
export class ZoteroRoamLog {
	level: LogLevel;
	origin: string;
	message: string;
	detail: string;
	context: Record<string, any>;
	intent: Intent | null;
	timestamp: Date;

	#LEVELS_MAPPING: Record<LogLevel, Intent> = {
		"error": "danger",
		"info": "primary",
		"warning": "warning"
	};

	#ICONS_MAPPING: Record<LogLevel, IconName> = {
		"error": "warning-sign",
		"info": "info-sign",
		"warning": "warning-sign"
	};

	constructor(obj: LogConfig = {}, level: LogLevel = "info"){
		const { origin = "", message = "", detail = "", context = {}, showToaster = false } = obj;
		this.level = level;
		this.origin = origin;
		this.message = message;
		this.detail = detail;
		this.context = context;
		this.intent = this.#LEVELS_MAPPING[level] || null;
		this.timestamp = new Date();

		if(showToaster){
			zrToaster.show({
				icon: this.#ICONS_MAPPING[level] || null,
				intent: this.intent,
				message: (
					this.detail
						? <>
							<H5>{this.message}</H5>
							<p>{this.detail}</p>
						</>
						: this.message
				),
				timeout: showToaster.constructor === Number ? showToaster : 1000
			});
		}
	}
}


/** Formats Zotero notes/annotations items */
export function _formatNotes(
	/** The Array of Zotero notes/annotations */
	notes: (ZItemNote | ZItemAnnotation)[],
	/** The UID of the parent item's Roam page, if it exists */
	pageUID: string | null = null,
	/** The user's current settings */
	{ annotationsSettings, notesSettings }: { annotationsSettings: SettingsAnnotations, notesSettings: SettingsNotes }
): RImportableElement[] {
	if (!notes || notes.length == 0) {
		return [];
	} else {
		const annotItems = notes
			.filter(n => n.data.itemType == "annotation")
			.sort((a,b) => compareAnnotationRawIndices(a.data.annotationSortIndex, b.data.annotationSortIndex));
		const noteItems = notes
			.filter(n => n.data.itemType == "note")
			.sort((a, b) => a.data.dateAdded < b.data.dateAdded ? -1 : 1);
		const formattedOutput = [
			...formatZoteroAnnotations(annotItems, annotationsSettings),
			...formatZoteroNotes(noteItems, notesSettings)
		];

		const { nest_char, nest_position, nest_preset, nest_use } = notesSettings;

		// If nesting is disabled, simply return the array of blocks
		if(nest_use == "preset" && !nest_preset){
			return formattedOutput;
		}

		// Else if the page UID was provided, check if the page already has a block with the same content
		// If yes, set that block as the parent for all the outputted blocks
		if(pageUID){
			const blockString = ((nest_use == "custom") ? nest_char : nest_preset) || "";
			const existingBlock = findRoamBlock(blockString, pageUID);

			if(existingBlock){
				const { uid, children = [] } = existingBlock;
				const pos = (nest_position == "bottom") ? children.length : 0;

				return formattedOutput.map(blck => {
					if(blck.constructor === String){
						return {
							string: blck,
							text: blck,
							order: pos,
							parentUID: uid
						};
					} else {
						return {
							...blck,
							order: pos,
							parentUID: uid
						};
					}
				});
			}
		}

		const blockString = (nest_use == "custom" ? nest_char : nest_preset) || "";
		return [{
			string: blockString,
			text: blockString,
			children: formattedOutput
		}];

	}
}

/** Compiles a bibliography for a list of items */
async function _getBibEntries(citekeys: string[], { libraries, queryClient }: { libraries: ZLibrary[], queryClient: QueryClient }): Promise<string> {
	const libraryItems = _getItems("items", {}, { queryClient });
	const groupedList = citekeys.reduce((obj, citekey) => {
		const libItem = libraryItems.find(it => it.key == citekey);
		if (libItem) {
			const location = libItem.library.type + "s/" + libItem.library.id;
			if (Object.keys(obj).includes(location)) {
				obj[location].push(libItem.data.key);
			} else {
				obj[location] = [libItem.data.key];
			}
		}
		return obj;
	}, {});

	const bibEntries: Promise<string>[] = [];

	Object.keys(groupedList)
		.forEach(libPath => {
			const library = libraries.find(lib => lib.path == libPath);
			if (library) {
				bibEntries.push(fetchBibEntries(groupedList[libPath], library));
			}
		});

	const bibOutput = await Promise.all(bibEntries);

	return bibOutput.join("\n");

}

/** Returns an item's formatted bibliography as returned by the Zotero API */
async function _getItemCitation(item: ZItemTop, config: Partial<ZoteroAPI.Requests.BibliographyArgs> = {}, { libraries }: { libraries: ZLibrary[] }): Promise<string> {
	const location = item.library.type + "s/" + item.library.id;
	const library = libraries.find(lib => lib.path == location);

	const bib = await fetchBibliography(item.data.key, library, config);
	return cleanBibliographyHTML(bib);
}


/** Retrieves the (cached) list of collections for a given library */
function _getCollections(library: ZLibrary, { queryClient }: { queryClient: QueryClient }): ZoteroAPI.Collection[] {
	const { /*apikey,*/ path } = library;
	const queryKey: QueryKeyCollections = ["collections", { library: path }];
	const datastore = queryClient.getQueryData<QueryDataCollections>(queryKey);
	return datastore?.data || [];
}

/** Returns the (cached) children for a given item */
function _getItemChildren(item: ZItemTop, { queryClient }: { queryClient: QueryClient }) {
	const location = item.library.type + "s/" + item.library.id;
	return _getItems("children", {
		predicate: (query: Query<unknown, unknown, QueryDataItems, QueryKeyItems>) => {
			const { queryKey } = query;
			return queryKey[1].dataURI.startsWith(location);
		}
	}, { queryClient })
		.filter(el => el.data.parentItem == item.data.key) as (ZItemAttachment | ZItemNote | ZItemAnnotation)[];
}


type CollectionOptions = { brackets: boolean, return_as: "array" | "string" };

/** Retrieves an item's collections' names, from a given list of collections
 * @param {{return_as?: ("string"|"array"), brackets?: Boolean}} config - Additional configuration 
 * @returns The names of the item's collections, if any
 */
function _getItemCollections(
	item: ZItemTop,
	collectionList: ZoteroAPI.Collection[],
	{ return_as = "string", brackets = true }: Partial<CollectionOptions> = {}
): string | string[] {
	if (item.data.collections.length > 0) {
		const output: string[] = [];

		item.data.collections.forEach(cl => {
			const libCollection = collectionList.find(el => el.key == cl);
			if (libCollection) { output.push(libCollection.data.name); }
		});

		const collectionsList = (brackets == true) 
			? output.map(cl => `[[${cl}]]`) 
			: output;
        
		switch(return_as){
		case "array":
			return collectionsList;
		case "string":
		default:
			return collectionsList.join(", ");
		}
	} else {
		return [];
	}
}

/** Returns the date on which an item was added to Zotero, in DNP format */
function _getItemDateAdded(item: ZItem, { brackets = true }: { brackets?: boolean } = {}): string{
	return makeDNP(item.data.dateAdded, { brackets });
}


type LinkType = "local" | "web";
type LinkOptions = {
	format: "markdown" | "target",
	text: string
};
/** Returns a link for the item (web or local) */
function _getItemLink(item: ZItemTop, type: LinkType = "local", config: Partial<LinkOptions> = {}){
	return (type == "local")
		? getLocalLink(item, config)
		: getWebLink(item, config);
}

/* istanbul ignore next */
/** Formats an item's and its children's metadata for import to Roam using the default template */
export function _getItemMetadata(
	item: ZItemTop, pdfs: ZItemAttachment[], notes: (ZItemNote | ZItemAnnotation)[],
	{ annotationsSettings, notesSettings, typemap }: { annotationsSettings: SettingsAnnotations, notesSettings: SettingsNotes, typemap: SettingsTypemap }
): RImportableElement[] {
	const metadata: RImportableElement[] = [];

	if (item.data.title) { metadata.push(`Title:: ${item.data.title}`); } // Title, if available
	if (item.data.creators.length > 0) { metadata.push(`Author(s):: ${_getItemCreators(item, { return_as: "string", brackets: true, use_type: true })}`); } // Creators list, if available
	if (item.data.abstractNote) { metadata.push(`Abstract:: ${item.data.abstractNote}`); } // Abstract, if available
	if (item.data.itemType) { metadata.push(`Type:: ${_getItemType(item, { brackets: true }, { typemap })}`); } // Item type, according to typemap
	metadata.push(`Publication:: ${_getItemPublication(item, { brackets: true })}`);
	if (item.data.url) { metadata.push(`URL : ${item.data.url}`); }
	if (item.data.dateAdded) { metadata.push(`Date Added:: ${_getItemDateAdded(item)}`); } // Date added, as Daily Notes Page reference
	metadata.push(`Zotero links:: ${_getItemLink(item, "local", { format: "markdown", text: "Local library" })}, ${_getItemLink(item, "web", { format: "markdown", text: "Web library" })}`); // Local + Web links to the item
	if (item.data.tags.length > 0) { metadata.push(`Tags:: ${_getItemTags(item, { return_as: "string", brackets: true })}`); } // Tags, if any

	if (pdfs.length > 0) {
		metadata.push(`PDF links : ${(_formatPDFs(pdfs, "links") as string[]).join(", ")}`);
	}
	if (notes.length > 0) {
		const formattedOutput = _formatNotes(notes, null, { annotationsSettings, notesSettings });
		metadata.push(...formattedOutput);
	}

	return metadata;
}

/** Retrieves the publication details for a given item.
 * The extension will check for the existence of a `publicationTitle`, then a `bookTitle`, then a `university` name.
 */
function _getItemPublication(item: ZItemTop, { brackets = true }: { brackets?: boolean } = {}): string {
	const maybePublication = item.data.publicationTitle || item.data.bookTitle || item.data.university;
	if(maybePublication){
		return (brackets == true)
			? `[[${maybePublication}]]`
			: maybePublication;
	} else {
		return "";
	}
}

/** Retrieves the type of a Zotero item, according to a given typemap */
function _getItemType(item: ZItemTop, { brackets = true }: { brackets?: boolean } = {}, { typemap }: { typemap: SettingsTypemap }): string {
	const type = typemap[item.data.itemType] || item.data.itemType;
	return (brackets == true ? `[[${type}]]` : type);
}


type SelectItemsOption = "all" | "annotations" | "attachments" | "children" | "items" | "notes" | "pdfs";
type SelectItemsReturn =
	| ZItem[]
	| ZItemAnnotation[]
	| ZItemAttachment[]
	| (ZItemAttachment | ZItemNote | ZItemAnnotation)[]
	| ZItemTop[]
	| (ZItemNote | ZItemAnnotation)[]
	| ZItemAttachment[];

/** Returns the current items in the query cache, with optional configuration */
function _getItems(select: SelectItemsOption, filters: QueryFilters = {}, { queryClient }: { queryClient: QueryClient }): SelectItemsReturn {
	const items = queryClient.getQueriesData<QueryDataItems>({ queryKey: ["items"], ...filters })
		.map(query => {
			const [/* queryKey */, queryData] = query;
			return queryData?.data || [];
		})
		.flat(1);

	switch (select) {
	case "items":
		return items.filter(it => !["attachment", "note", "annotation"].includes(it.data.itemType));
	case "attachments":
		return items.filter(it => it.data.itemType == "attachment");
	case "children":
		return items.filter(it => ["note", "annotation"].includes(it.data.itemType) || (it.data.itemType == "attachment" && it.data.contentType == "application/pdf"));
	case "annotations":
		return items.filter(it => it.data.itemType == "annotation");
	case "notes":
		return items.filter(it => it.data.itemType == "note");
	case "pdfs":
		return items.filter(it => it.data.itemType == "attachment" && it.data.contentType == "application/pdf");
	case "all":
	default:
		return items;
	}
}


/** Returns the (cached) map of tags for a given library */
function _getTags(location: string, { libraries, queryClient }: { libraries: ZLibrary[], queryClient: QueryClient }) {
	const { /*apikey,*/ path } = libraries.find(lib => lib.path == location)!;
	const queryKey: QueryKeyTags = ["tags", { library: path }];

	const datastore = queryClient.getQueryData<QueryDataTags>(queryKey)!;
	return datastore.data;
}
