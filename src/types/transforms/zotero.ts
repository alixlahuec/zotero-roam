import { ZoteroAPI } from "@clients/zotero";


export interface ZCleanItemTop {
	abstract: string,
	authors: string,
	authorsFull: string[],
	authorsLastNames: string[],
	authorsRoles: string[],
	children: {
		notes: (ZItemAnnotation|ZItemNote)[],
		pdfs: ZItemAttachment[]
	},
	createdByUser: string | null,
	inGraph: string | false,
	itemKey: string,
	itemType: ZoteroAPI.ItemTop["data"]["itemType"],
	key: string,
	location: string,
	meta: string,
	publication: string,
	tags: string[],
	title: string,
	weblink: { href: string, title: string } | false,
	year: string,
	zotero: { local: string, web: string },
	_multiField: string,
	raw: ZItemTop
}

export interface ZCleanItemPDF {
	annotations: ZItemAnnotation[],
	key: string,
	link: string,
	parent: ZItemTop | Record<string, never>,
	tags: string[],
	title: string,
	raw: ZItemAttachment
}

export interface ZSimplifiedAnnotation {
	color: string,
	comment: string,
	date_added: string,
	date_modified: string,
	day_added: string,
	day_modified: string,
	key: string,
	library: string,
	link_page: string,
	link_pdf: string,
	page_label: string,
	parent_item: string,
	position: Record<string, unknown>,
	raw: ZItemAnnotation,
	sortIndex: number[],
	tags: string[],
	tags_string: string,
	text: string | null,
	type: "highlight" | "image"
}

export interface ZSimplifiedNote {
	date_added: string,
	date_modified: string,
	key: string,
	location: string,
	link_note: string,
	note: string,
	parent_item: string,
	raw: ZItemNote,
	tags: string[]
}

type ZItemBase = {
	/** Indicates if the item has a pinned citekey, based on the contents of the `data.extra` field */
	has_citekey: boolean
};

export type ZItemAnnotation = ZoteroAPI.ItemAnnotation & ZItemBase;
export type ZItemAttachment = ZoteroAPI.ItemAttachment & ZItemBase;
export type ZItemNote = ZoteroAPI.ItemNote & ZItemBase;
export type ZItemTop = ZoteroAPI.ItemTop & ZItemBase;
export type ZItem = ZItemAnnotation | ZItemAttachment | ZItemNote | ZItemTop;

export const isZAnnotation = (item: ZItem): item is ZItemAnnotation => item.data.itemType === "annotation";
export const isZNote = (item: ZItem): item is ZItemNote => item.data.itemType === "note";
export const isZNoteOrAnnotation = (item: ZItem): item is ZItemAnnotation | ZItemNote => isZAnnotation(item) || isZNote(item);
export const isZAttachment = (item: ZItem): item is ZItemAttachment => item.data.itemType === "attachment";
export const isZItemTop = (item: ZItem): item is ZItemTop => !(isZAttachment(item) || isZNoteOrAnnotation(item));

export interface ZLibraryContents {
	items: ZItemTop[],
	notes: (ZItemAnnotation | ZItemNote)[],
	pdfs: ZItemAttachment[]
}

export interface ZLibrary {
	apikey: string,
	path: string
}

export interface ZEnrichedCollection extends ZoteroAPI.Collection {
	depth: number
}

type RoamPage = { title: string, uid: string }

export type ZTagEntry = {
	token: string,
	roam: RoamPage[],
	zotero: ZoteroAPI.Tag[]
}
export type ZTagList = Record<string, ZTagEntry[]>;

export type ZTagMap = Map<string, (ZoteroAPI.Tag | ZoteroAPI.Tag[])>

export type ZTagDictionary = Record<string, string[]>;

export type ZTagStats = {
	nAuto: number,
	nRoam: number,
	nTags: number,
	nTotal: number
};

export type ZTagSuggestionBase = {
	use: {
		roam: string[],
		zotero: string[]
	}
};

export type ZTagSuggestionAuto = {
	recommend: string,
	type: "auto"
} & ZTagSuggestionBase;

export type ZTagSuggestionManual = {
	recommend: string | null,
	type: "manual"
} & ZTagSuggestionBase;

export type ZTagSuggestionNone = {
	recommend: string | null,
	type: null
} & ZTagSuggestionBase;

export type ZTagSuggestion = ZTagSuggestionAuto | ZTagSuggestionManual | ZTagSuggestionNone;

export type ZLinkType = "local" | "web";
export type ZLinkOptions = {
	format: "markdown" | "target",
	text: string
};

export type ZLogItem = {
	abstract: string,
	children: {
		notes: (ZItemNote | ZItemAnnotation)[],
		pdfs: ZItemAttachment[]
	},
	edited: Date,
	inGraph: string | false,
	itemType: ZItemTop["data"]["itemType"],
	key: string,
	location: string,
	meta: string,
	publication: string,
	raw: ZItemTop,
	title: string
};

export type ZDataViewContents = {
	today: ZLogItem[],
	yesterday: ZLogItem[],
	recent: ZLogItem[],
	numItems: number
};
