import { _formatPDFs, _getItemCreators, _getItemRelated, _getItemTags } from "./public";
import { _getBibEntries, _getBibliography } from "./api/public";
import { formatZoteroAnnotations, formatZoteroNotes, getLocalLink, getWebLink, makeDNP } from "./utils";

export default class ZoteroRoam {
	constructor({ queryClient, requests, settings }) {
		const { libraries } = requests;
		const { annotations, metadata, notes, typemap } = settings;

		this.libraries = libraries;
		this.queryClient = queryClient;
		this.settings = { annotations, metadata, notes, typemap };
	}

	// To be called in the RequestsWidget
	/* istanbul ignore next */
	updateLibraries(val) {
		this.libraries = val;
	}

	/* istanbul ignore next */
	updateSetting(op, val) {
		this.settings[op] = val;
	}

	formatNotes(notes) {
		return _formatNotes(notes, {
			annotationsSettings: this.settings.annotations,
			notesSettings: this.settings.notes
		});
	}

	formatPDFs(...args){
		return _formatPDFs(...args);
	}

	async getBibEntries(citekeys) {
		return await _getBibEntries(citekeys, {
			libraries: this.libraries,
			queryClient: this.queryClient
		});
	}

	async getBibliography(item, config = {}) {
		return await _getBibliography(item, config, {
			libraries: this.libraries
		});
	}

	getChildren(item) {
		return _getChildren(item, {
			queryClient: this.queryClient
		});
	}

	getCollections(library) {
		return _getCollections(library, {
			queryClient: this.queryClient
		});
	}

	getItemCollections(item, { brackets = true } = {},) {
		const location = item.library.type + "s/" + item.library.id;
		const library = this.libraries.find(lib => lib.path == location);
		const collectionList = this.getCollections(library);

		return _getItemCollections(item, collectionList, { brackets });
	}

	getItemCreators(...args){
		return _getItemCreators(...args);
	}

	/* istanbul ignore next */
	getItemMetadata(item, pdfs, notes) {
		return _getItemMetadata(item, pdfs, notes, {
			annotationsSettings: this.settings.annotations,
			notesSettings: this.settings.notes,
			typemap: this.settings.typemap
		});
	}

	getItemRelated(item, { return_as = "citekeys", brackets = true } = {}) {
		const { type: libType, id: libID } = item.library;
		const datastore = this.getItems("items")
			.filter(it => it.library.id == libID && it.library.type == libType);

		return _getItemRelated(item, datastore, { return_as, brackets });
	}

	getItemTags(...args){
		return _getItemTags(...args);
	}

	getItemType(item, { brackets = true } = {}) {
		return _getItemType(item, { brackets }, {
			typemap: this.settings.typemap
		});
	}

	getItems(select = "all", filters = {}) {
		return _getItems(select, filters, {
			queryClient: this.queryClient
		});
	}

	getTags(location) {
		return _getTags(location, {
			libraries: this.libraries,
			queryClient: this.queryClient
		});
	}
}


/** Formats Zotero notes/annotations items
     * @param {ZoteroItem[]} notes - The Array of Zotero notes/annotations
     * @param {{
     * annotationsSettings: SettingsAnnotations, 
     * notesSettings: SettingsNotes
     * }} settings - The user's current settings
     * @returns The formatted Array
     */
function _formatNotes(notes, { annotationsSettings, notesSettings }) {
	if (!notes) {
		return [];
	} else {
		const annotItems = notes.filter(n => n.data.itemType == "annotation");
		const noteItems = notes.filter(n => n.data.itemType == "note");

		return [
			...formatZoteroAnnotations(annotItems, annotationsSettings),
			...formatZoteroNotes(noteItems, notesSettings)
		];
	}
}

/** Returns the (cached) children for a given item
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {{ queryClient: * }} context - The current context for the extension
 * @returns The item's children
 */
function _getChildren(item, { queryClient }) {
	const location = item.library.type + "s/" + item.library.id;
	return _getItems("children", { predicate: (queryKey) => queryKey[1].dataURI.startsWith(location) }, { queryClient })
		.filter(el => el.data.parentItem == item.data.key);
}

/** Retrieves the (cached) list of collections for a given library
 * @param {ZoteroLibrary} library - The targeted Zotero library
 * @param {{ queryClient: * }} context - The current context for the extension
 * @returns The library's collections
 */
function _getCollections(library, { queryClient }) {
	const { apikey, path } = library;
	const datastore = queryClient.getQueryData(["collections", { apikey, library: path }]);
	return datastore.data;
}

/** Retrieves an item's collections' names, from a given list of collections
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {ZoteroCollection[]} collectionList - The list of library collections to match data to
 * @param {{brackets: Boolean}} config - Additional configuration 
 * @returns {String[]} The Array containing the names of the item's collections, if any
 */
export function _getItemCollections(item, collectionList, { brackets = true } = {}) {
	if (item.data.collections.length > 0) {
		const output = [];

		item.data.collections.forEach(cl => {
			const libCollection = collectionList.find(el => el.key == cl);
			if (libCollection) { output.push(libCollection.data.name); }
		});

		return (brackets == true ? output.map(cl => `[[${cl}]]`) : output);
	} else {
		return [];
	}
}

/* istanbul ignore next */
/** Formats an item's and its children's metadata for import to Roam using the default template
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {ZoteroItem} pdfs - The item's PDFs, if any
 * @param {ZoteroItem} notes - The item's linked notes, if any
 * @param {{
 * annotationsSettings: SettingsAnnotations,
 * notesSettings: SettingsNotes,
 * typemap: SettingsTypemap
 * }} settings - The user's current settings
 * @returns The formatted metadata output
 */
function _getItemMetadata(item, pdfs, notes, { annotationsSettings, notesSettings, typemap }) {
	const metadata = [];

	if (item.data.title) { metadata.push(`Title:: ${item.data.title}`); } // Title, if available
	if (item.data.creators.length > 0) { metadata.push(`Author(s):: ${_getItemCreators(item, { return_as: "string", brackets: true, use_type: true })}`); } // Creators list, if available
	if (item.data.abstractNote) { metadata.push(`Abstract:: ${item.data.abstractNote}`); } // Abstract, if available
	if (item.data.itemType) { metadata.push(`Type:: ${_getItemType(item, { brackets: true }, { typemap })}`); } // Item type, according to typemap
	metadata.push(`Publication:: ${item.data.publicationTitle || item.data.bookTitle || ""}`);
	if (item.data.url) { metadata.push(`URL : ${item.data.url}`); }
	if (item.data.dateAdded) { metadata.push(`Date Added:: ${makeDNP(item.data.dateAdded, { brackets: true })}`); } // Date added, as Daily Notes Page reference
	metadata.push(`Zotero links:: ${getLocalLink(item, { format: "markdown", text: "Local library" })}, ${getWebLink(item, { format: "markdown", text: "Web library" })}`); // Local + Web links to the item
	if (item.data.tags.length > 0) { metadata.push(`Tags:: ${_getItemTags(item, { return_as: "string", brackets: true })}`); } // Tags, if any

	if (pdfs.length > 0) {
		metadata.push(`PDF links : ${_formatPDFs(pdfs, "links").join(", ")}`);
	}
	if (notes.length > 0) {
		metadata.push({
			string: "[[Notes]]",
			children: _formatNotes(notes, { annotationsSettings, notesSettings })
		});
	}

	return metadata;
}

/** Retrieves the type of a Zotero item, according to a given typemap
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {{brackets: Boolean}} config - Additional configuration
 * @param {SettingsTypemap} typemap - The typemap to be used
 * @returns {String} The clean type for the item
 */
export function _getItemType(item, { brackets = true } = {}, { typemap }) {
	const type = typemap[item.data.itemType] || item.data.itemType;
	return (brackets == true ? `[[${type}]]` : type);
}

/** Returns the current items in the query cache, with optional configuration
 * @param {("all"|"annotations"|"attachments"|"children"|"items"|"notes"|"pdfs")} select - The type of items to retrieve
 * @param {Object} filters - Optional filters for the item queries
 * @param {{ queryClient: * }} context - The current context for the extension
 * @returns {ZoteroItem[]} - The requested items
 */
export function _getItems(select, filters, { queryClient }) {
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
 * @param {{ libraries: ZoteroLibrary[], queryClient: * }} context - The current context for the extension
 * @returns The library's tags map
 */
function _getTags(location, { libraries, queryClient }) {
	const library = libraries.find(lib => lib.path == location);
	const { apikey, path } = library;
	const datastore = queryClient.getQueryData(["tags", { apikey, library: path }]);
	return datastore.data;
}
