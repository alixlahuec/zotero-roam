import { H5 } from "@blueprintjs/core";
import zrToaster from "Components/ExtensionToaster";

import { _formatPDFs, _getItemCreators, _getItemRelated, _getItemTags } from "./public";
import { cleanBibliographyHTML, cleanErrorIfAxios, fetchBibEntries, fetchBibliography } from "./api/utils";
import { compareAnnotationRawIndices, formatZoteroAnnotations, formatZoteroNotes, getLocalLink, getWebLink, makeDNP } from "./utils";
import { findRoamBlock } from "Roam";

import { IDB_REACT_QUERY_CLIENT_KEY, IDB_REACT_QUERY_STORE_NAME } from "./constants";


/**
 * Creates a new public API instance for the extension. This is meant to make available an interface for users as well as other plugins to consume some of the extension's data and functionalities, in a controlled manner. Updates to settings are done by the relevant widgets.
 * @borrows _formatPDFs as ZoteroRoam#formatPDFs
 * @borrows _getItemCreators as ZoteroRoam#getItemCreators
 * @borrows _getItemDateAdded as ZoteroRoam#getItemDateAdded
 * @borrows _getItemLink as ZoteroRoam#getItemLink
 * @borrows _getItemPublication as ZoteroRoam#getItemPublication
 * @borrows _getItemTags as ZoteroRoam#getItemTags
 */
export default class ZoteroRoam {
	/** @constant {IDBDatabase} */
	#db;
	/** @constant {UserRequests["libraries"]} */
	#libraries;
	/** @constant {QueryClient} */
	#queryClient;
	/** @constant {Pick<UserSettings, "annotations" | "notes" | "typemap" >} */
	#settings;
	/** @constant {ZoteroRoamLog[]} */
	logs = [];

	/**
     * @param {{
	 * idbDatabase: IDBDatabase|null,
     * queryClient: QueryClient,
     * requests: UserRequests,
     * settings: Object
     * }} context - The context in which the instance is being created
     */
	constructor({ idbDatabase = null, queryClient, requests, settings }) {
		const { libraries } = requests;
		const { annotations, notes, typemap } = settings;

		this.#db = idbDatabase;
		this.#libraries = libraries;
		this.#queryClient = queryClient;
		this.#settings = { annotations, notes, typemap };

	}

	/* istanbul ignore next */
	/** Clears the contents of the React Query store from the database. */
	async clearDataCache(){
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
	async deleteDatabase(){
		if(this.#db){
			await this.#db.deleteSelf();
		}
	}

	/* istanbul ignore next */
	/** Checks if there is a cached version of the React Query client
	 * @returns 
	 */
	async isDataCached(){
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
	updateLibraries(val) {
		this.#libraries = val;
	}

	/* istanbul ignore next */
	updateSetting(op, val) {
		this.#settings[op] = val;
	}

	send(obj, level = "info"){
		this.logs.push(new ZoteroRoamLog(obj, level));
	}

	error(obj){
		this.send(obj, "error");
	}

	info(obj){
		this.send(obj, "info");
	}

	warn(obj){
		this.send(obj, "warning");
	}

	formatPDFs = _formatPDFs;
	getItemCreators = _getItemCreators;
	getItemDateAdded = _getItemDateAdded;
	getItemLink = _getItemLink;
	getItemPublication = _getItemPublication;
	getItemTags = _getItemTags;


	/** Formats Zotero notes and annotations, with current user settings
     * @param {(ZItemNote|ZItemAnnotation)[]} notes 
     * @returns 
     */
	formatNotes(notes) {
		return _formatNotes(notes, null, {
			annotationsSettings: this.#settings.annotations,
			notesSettings: this.#settings.notes
		});
	}

	/** Retrieves the bibliographic entries for a list of items
     * @param {String[]} citekeys - The targeted items' citekeys
     * @returns 
     */
	async getBibEntries(citekeys) {
		return await _getBibEntries(citekeys, {
			libraries: this.#libraries,
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the formatted bibliography for a given item, with optional config
     * @param {ZItemTop} item - The targeted item
     * @param {ZoteroAPI.Requests.BibliographyArgs} config - Optional parameters to use to format the bibliography
     * @returns 
     */
	async getItemCitation(item, config = {}) {
		return await _getItemCitation(item, config, {
			libraries: this.#libraries
		});
	}

	/** Retrieves the list of collections for a given library
     * @param {String} path - The targeted library
     * @returns 
     */
	getCollections(path) {
		const library = this.#libraries.find(lib => lib.path == path);
		return _getCollections(library, {
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the children for a given item
     * @param {ZItemTop} item - The targeted item
     * @returns 
     */
	getItemChildren(item) {
		return _getItemChildren(item, {
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the list of collections for a given item
     * @param {ZItemTop} item - The targeted item
     * @param {{return_as?: ("string"|"array"), brackets?: Boolean}} config - Optional parameters to use to format the collections 
     * @returns 
     */
	getItemCollections(item, { return_as = "string", brackets = true } = {},) {
		const path = item.library.type + "s/" + item.library.id;
		const collectionList = this.getCollections(path);

		return _getItemCollections(item, collectionList, { return_as, brackets });
	}

	/* istanbul ignore next */
	/** Formats an item's metadata into Roam blocks
     * @param {ZItemTop} item - The targeted item
     * @param {ZItemAttachment[]} pdfs - The item's linked PDFs, if any
     * @param {(ZItemNote|ZItemAnnotation)[]} notes - The item's linked notes, if any
     * @returns 
     */
	getItemMetadata(item, pdfs, notes) {
		return _getItemMetadata(item, pdfs, notes, {
			annotationsSettings: this.#settings.annotations,
			notesSettings: this.#settings.notes,
			typemap: this.#settings.typemap
		});
	}

	/** Retrieves the in-library relations for a given item
     * @param {ZItem} item - The targeted item
     * @param {{return_as?: ("string"|"raw"|"array"), brackets?: Boolean}} config - Optional parameters to use to format the relations
     * @returns 
     */
	getItemRelated(item, { return_as = "string", brackets = true } = {}) {
		const { type: libType, id: libID } = item.library;
		const datastore = this.getItems("items")
			.filter(it => it.library.id == libID && it.library.type == libType);

		return _getItemRelated(item, datastore, { return_as, brackets });
	}

	/** Retrieves an item's type
     * @param {ZItemTop} item - The targeted item
     * @param {{brackets?: Boolean}} config - Optional parameters to use to format the type
     * @returns 
     */
	getItemType(item, { brackets = true } = {}) {
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
     * @param {("all"|"annotations"|"attachments"|"children"|"items"|"notes"|"pdfs")} select - The targeted set of items
     * @returns 
     */
	getItems(select = "all") {
		return _getItems(select, {}, {
			queryClient: this.#queryClient
		});
	}

	/** Retrieves the map of tags for a given library
     * @example
     * // Returns the map of tags for the library of user ID 123456 
     * .getTags("users/123456")
     * @param {String} path - The path of the targeted library 
     * @returns 
     */
	getTags(path) {
		return _getTags(path, {
			libraries: this.#libraries,
			queryClient: this.#queryClient
		});
	}
}

/**
 * Creates a log entry for the extension. This is meant to provide users with information about different events (e.g errors when fetching data), through an optional toast and more detailed logs.
 */
export class ZoteroRoamLog {
	level;
	origin;
	message;
	detail;
	context;
	intent;
	timestamp;

	/** @private */
	/** @constant {Record<string,Intent>} */
	#LEVELS_MAPPING = {
		"error": "danger",
		"info": "primary",
		"warning": "warning"
	};

	/** @private */
	/** @constant {Record<string,IconName>} */
	#ICONS_MAPPING = {
		"error": "warning-sign",
		"info": "info-sign",
		"warning": "warning-sign"
	};

	/**
	 * @param {{
	 * origin?: String,
	 * message?: String,
	 * detail?: String,
	 * context?: Object,
	 * showToaster?: Number|Boolean
	 * }} obj
	 * @param {("error"|"info"|"warning")} level
	 */
	constructor(obj = {}, level = "info"){
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


/** Formats Zotero notes/annotations items
 * @param {(ZItemNote|ZItemAnnotation)[]} notes - The Array of Zotero notes/annotations
 * @param {String?} pageUID - The UID of the parent item's Roam page (optional)
 * @param {{
 * annotationsSettings: SettingsAnnotations, 
 * notesSettings: SettingsNotes
 * }} settings - The user's current settings
 * @returns {RImportableElement[]} The formatted Array
 */
export function _formatNotes(notes, pageUID = null, { annotationsSettings, notesSettings }) {
	if (!notes) {
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

/** Compiles a bibliography for a list of items
 * @param {String[]} citekeys - The targeted items' citekeys
 * @param {{ libraries: ZLibrary[], queryClient: QueryClient }} context - The current context for the extension
 * @returns The compiled bibliography
 */
async function _getBibEntries(citekeys, { libraries, queryClient }) {
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

	const bibEntries = [];

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

/** Returns an item's formatted bibliography as returned by the Zotero API
 * @param {ZItemTop} item - The targeted Zotero item
 * @param {ZoteroAPI.Requests.BibliographyArgs} config - Optional parameters to use in the API call
 * @param {{libraries: ZLibrary[]}} requests - The user's current requests
 * @returns 
 */
async function _getItemCitation(item, config, { libraries }){
	const location = item.library.type + "s/" + item.library.id;
	const library = libraries.find(lib => lib.path == location);

	const bib = await fetchBibliography(item.data.key, library, config);
	return cleanBibliographyHTML(bib);
}

/** Retrieves the (cached) list of collections for a given library
 * @param {ZLibrary} library - The targeted Zotero library
 * @param {{ queryClient: QueryClient }} context - The current context for the extension
 * @returns The library's collections
 */
function _getCollections(library, { queryClient }) {
	const { /*apikey,*/ path } = library;
	const datastore = queryClient.getQueryData(["collections", { library: path }]);
	return datastore.data;
}

/** Returns the (cached) children for a given item
 * @param {ZItemTop} item - The targeted Zotero item
 * @param {{ queryClient: QueryClient }} context - The current context for the extension
 * @returns The item's children
 */
function _getItemChildren(item, { queryClient }) {
	const location = item.library.type + "s/" + item.library.id;
	return _getItems("children", { predicate: (queryKey) => queryKey[1].dataURI.startsWith(location) }, { queryClient })
		.filter(el => el.data.parentItem == item.data.key);
}

/** Retrieves an item's collections' names, from a given list of collections
 * @param {ZItemTop} item - The targeted Zotero item
 * @param {ZoteroAPI.Collection[]} collectionList - The list of library collections to match data to
 * @param {{return_as?: ("string"|"array"), brackets?: Boolean}} config - Additional configuration 
 * @returns {String|String[]} The names of the item's collections, if any
 */
function _getItemCollections(item, collectionList, { return_as = "string", brackets = true } = {}) {
	if (item.data.collections.length > 0) {
		const output = [];

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

/** Returns the date on which an item was added to Zotero, in DNP format
 * @param {ZItem} item - The targeted Zotero item
 * @param {{brackets?: Boolean}} config - Additional configuration
 * @returns {String}
 */
function _getItemDateAdded(item, { brackets = true } = {}){
	return makeDNP(item.data.dateAdded, { brackets });
}

/** Returns a link for the item (web or local)
 * @param {ZItemTop} item - The targeted Zotero item
 * @param {"local"|"web"} type - The type of link to create
 * @param {{format?: "markdown"|"target", text?: string}} config 
 * @returns 
 */
function _getItemLink(item, type = "local", config = {}){
	return (type == "local")
		? getLocalLink(item, config)
		: getWebLink(item, config);
}

/* istanbul ignore next */
/** Formats an item's and its children's metadata for import to Roam using the default template
 * @param {ZItemTop} item - The targeted Zotero item
 * @param {ZItemAttachment[]} pdfs - The item's PDFs, if any
 * @param {(ZItemNote|ZItemAnnotation)[]} notes - The item's linked notes, if any
 * @param {{
 * annotationsSettings: SettingsAnnotations,
 * notesSettings: SettingsNotes,
 * typemap: SettingsTypemap
 * }} settings - The user's current settings
 * @returns The formatted metadata output
 */
export function _getItemMetadata(item, pdfs, notes, { annotationsSettings, notesSettings, typemap }) {
	const metadata = [];

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
		metadata.push(`PDF links : ${_formatPDFs(pdfs, "links").join(", ")}`);
	}
	if (notes.length > 0) {
		const formattedOutput = _formatNotes(notes, null, { annotationsSettings, notesSettings });
		metadata.push(...formattedOutput);
	}

	return metadata;
}

/** Retrieves the publication details for a given item.
 * The extension will check for the existence of a `publicationTitle`, then a `bookTitle`, then a `university` name.
 * @param {ZItemTop} item - The targeted item
 * @returns {String}
 */
function _getItemPublication(item, { brackets = true } = {}){
	const maybePublication = item.data.publicationTitle || item.data.bookTitle || item.data.university;
	if(maybePublication){
		return (brackets == true)
			? `[[${maybePublication}]]`
			: maybePublication;
	} else {
		return "";
	}
}

/** Retrieves the type of a Zotero item, according to a given typemap
 * @param {ZItemTop} item - The targeted Zotero item
 * @param {{brackets?: Boolean}} config - Additional configuration
 * @param {SettingsTypemap} typemap - The typemap to be used
 * @returns {String} The clean type for the item
 */
function _getItemType(item, { brackets = true } = {}, { typemap }) {
	const type = typemap[item.data.itemType] || item.data.itemType;
	return (brackets == true ? `[[${type}]]` : type);
}

/** Returns the current items in the query cache, with optional configuration
 * @param {("all"|"annotations"|"attachments"|"children"|"items"|"notes"|"pdfs")} select - The type of items to retrieve
 * @param {Object} filters - Optional filters for the item queries
 * @param {{ queryClient: QueryClient }} context - The current context for the extension
 * @returns {(ZoteroAPI.Item)[]} - The requested items
 */
function _getItems(select, filters, { queryClient }) {
	const items = queryClient.getQueriesData(["items"], filters).map(query => (query[1] || {}).data || []).flat(1);

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

/** Returns the (cached) map of tags for a given library
 * @param {String} location - The path of the targeted Zotero library
 * @param {{ libraries: ZLibrary[], queryClient: QueryClient }} context - The current context for the extension
 * @returns The library's tags map
 */
function _getTags(location, { libraries, queryClient }) {
	const library = libraries.find(lib => lib.path == location);
	const { /*apikey,*/ path } = library;
	const datastore = queryClient.getQueryData(["tags", { library: path }]);
	return datastore.data;
}
