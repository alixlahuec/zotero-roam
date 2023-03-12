/** 
 * Parameters to control bibliography output from Zotero
*/
export interface ZoteroConfigBibliography {
	/** The output format(s) to use (API default: `data`). Multiple formats can be requested, by passing them as a comma-separated list.
	 * @example "data,bib"
	 */
	include?: string,
	/** Determines if URLs and DOIs should be formatted as links (API default: `0`). */
	linkwrap?: 0 | 1,
	/** The locale to use for generating citations (API default: `en-US`). */
	locale?: string,
	/** The citation style to use (API default: `chicago-note-bibliography`).
	 * @example "apa"
	 */
	style?: string
}

/* --- */
// https://github.com/zotero/translators/blob/master/index.d.ts

/** A creator of a Zotero item */
type ZoteroCreator = {
	/** The creator's role (author, editor, translator...) */
	creatorType: string
} & ({ name: string } | { firstName: string, lastName: string });

type ZoteroEntityLinks = Record<string, { href: string, type: string }>;

type ZoteroLibrary = {
	/** The library's Zotero ID */
	id: number,
	/** Links related to the library */
	links: ZoteroEntityLinks,
	/** The library's display name */
	name: string,
	/** The library's type */
	type: "group" | "user"
};

/** Basic metadata for Zotero items and collections */
interface ZoteroBase {
	/** The entity's Zotero key */
	key: string,
	/** The entity's Zotero library */
	library: ZoteroLibrary,
	/** Links related to the Zotero entity */
	links: ZoteroEntityLinks,
	/** Metadata about the entity */
	meta: Record<string,any>,
	/** The entity's current version */
	version: number
}

type ZoteroExportFormat =
	| "bibtex"
	| "biblatex"
	| "bookmarks"
	| "coins"
	| "csljson"
	| "csv"
	| "mods"
	| "refer"
	| "rdf_bibliontology"
	| "rdf_dc"
	| "rdf_zotero"
	| "ris"
	| "tei"
	| "wikipedia";

type ZoteroExportFormatData = {
	[Format in ZoteroExportFormat]: unknown
}

interface ZoteroIncludeJSON extends ZoteroExportFormatData {
	bib: string,
	citation: string,
	data: Record<string, any>
}

export type ZoteroIncludeFormat = keyof ZoteroIncludeJSON;

export type ZoteroBibliography<K extends ZoteroIncludeFormat> = ZoteroBase & Pick<ZoteroIncludeJSON, K> & {
	meta: {
		creatorSummary: string,
		parsedDate: string
	} & Record<string, any>
};


/**
 * A Zotero collection
 */
export interface ZoteroCollection extends ZoteroBase {
	data: {
		/** The collection's Zotero key */
		key: ZoteroBase["key"],
		/** The collection's display name */
		name: string,
		/** The key of the collection's parent, if any */
		parentCollection: string | false,
		relations: Record<string, string | string[]>,
		version: ZoteroBase["version"]
	} & Record<string,any>,
	meta: {
		numCollections: number,
		numItems: number
	}
}

export interface ZoteroDeleted {
	collections: string[],
	items: string[],
	searches: string[],
	tags: string[]
}

/**
 * A Zotero tag
 */
export interface ZoteroTag {
	links: ZoteroBase["links"],
	meta: {
		numItems: number,
		type: 0 | 1
	},
	tag: string,
}

export type ZoteroItemTopType =
	|"artwork"
	|"audioRecording"
	| "bill"
	| "blogPost"
	| "book"
	| "bookSection"
	| "case"
	| "computerProgram"
	| "conferencePaper"
	| "dictionaryEntry"
	| "document"
	| "email"
	| "encyclopediaArticle"
	| "film"
	| "forumPost"
	| "hearing"
	| "instantMessage"
	| "interview"
	| "journalArticle"
	| "letter"
	| "magazineArticle"
	| "manuscript"
	| "map"
	| "newspaperArticle"
	| "patent"
	| "podcast"
	| "preprint"
	| "presentation"
	| "radioBroadcast"
	| "report"
	| "statute"
	| "thesis"
	| "tvBroadcast"
	| "videoRecording"
	| "webpage";

type ZoteroItemType = ZoteroItemTopType | "attachment" | "annotation" | "note";

/** Basic metadata for Zotero items */
export interface ZoteroItemDataBase<T extends ZoteroItemType> {
	/** The datetime when the item was created */
	dateAdded: string,
	/** The datetime when the item was last modified */
	dateModified: string,
	/** The item's type */
	itemType: T,
	/** The item's Zotero key */
	key: ZoteroBase["key"],
	/** Zotero entities linked that are linked to the item */
	relations: Record<string, string | string[]>,
	/** The item's tags */
	tags: ZoteroTag[]
	/** The item's current version */
	version: ZoteroBase["version"]
}

/**
 * A Zotero annotation
 */
export interface ZoteroItemAnnotation extends ZoteroBase {
	data: ZoteroItemDataBase<"annotation"> & {
		/** The highlight color of the annotation */
		annotationColor: string,
		/** The text of the comment, if any */
		annotationComment: string,
		/** The label for the page where the annotation is located */
		annotationPageLabel: string,
		/** The position of the annotation in the PDF. This is a stringified JSON object, containing the page index and the rect coordinates of the annotation.
		 * @example "{\"pageIndex\":24,\"rects\":[[203.6,431.053,546.865,441.6],[203.6,419.056,536.829,429.603],[203.6,407.059,566.448,417.606],[203.6,395.062,564.521,405.609],[203.6,383.065,265.699,393.612]]}"
		 */
		annotationPosition: string,
		/** The position of the annotation in the page.
		 * @example "00024|001317|00350"
		 */
		annotationSortIndex: string,
		/** The text of the highlight */
		annotationText: string,
		/** The type of annotation */
		annotationType: "highlight" | "image",
		/** The Zotero key of the item's parent */
		parentItem: string
	}
}

/**
 * A Zotero attachment
 */
export interface ZoteroItemAttachment extends ZoteroBase {
	data: ZoteroItemDataBase<"attachment"> & {
		/** The type of attachment
		 * @example "application/pdf"
		 */
		contentType: string,
	} & Record<string,any>
}

/**
 * A Zotero note
 */
export interface ZoteroItemNote extends ZoteroBase {
	data: ZoteroItemDataBase<"note"> & {
		note: string,
		parentItem: string
	} & Record<string,any>
}

/**
 * A Zotero top-level item
 */
export interface ZoteroItemTop extends ZoteroBase {
	data: ZoteroItemDataBase<ZoteroItemTopType> & {
		abstractNote?: string,
		bookTitle?: string,
		collections?: string[],
		creators: ZoteroCreator[],
		DOI?: string,
		extra: string,
		publicationTitle?: string,
		title: string,
		university?: string,
		url?: string
	} & Record<string,any>,
	meta: {
		creatorSummary: string,
		parsedDate: string
	} & Record<string,any>
}

/**
 * A Zotero item (top-level, annotation, note, attachment...)
 */
export type ZoteroItem = ZoteroItemAnnotation | ZoteroItemAttachment | ZoteroItemNote | ZoteroItemTop;

export interface ZoteroPermissionsResponse {
	access: Record<string, string>,
	key: string,
	userID: number,
	username: string
}
