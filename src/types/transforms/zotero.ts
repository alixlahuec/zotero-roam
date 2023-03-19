import { ZoteroAPI } from "../externals/zotero";


export interface ZCleanItemTop {
	abstract: string,
	authors: string,
	authorsFull: string[],
	authorsLastNames: string[],
	authorsRoles: string[],
	children: {
		notes: (ZoteroAPI.ItemAnnotation|ZoteroAPI.ItemNote)[],
		pdfs: ZoteroAPI.ItemAttachment[]
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
	raw: ZoteroAPI.ItemTop
}

export interface ZCleanItemPDF {
	annotations: ZoteroAPI.ItemAnnotation[],
	key: string,
	link: string,
	parent: ZoteroAPI.ItemTop | Record<string, never>,
	title: string,
	raw: ZoteroAPI.ItemAttachment
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
	text: string | null,
	type: "highlight" | "image"
}

type ZItemBase = {
	has_citekey: boolean
};

export type ZItem = ZoteroAPI.Item & ZItemBase;
export type ZItemAnnotation = ZoteroAPI.ItemAnnotation & ZItemBase;
export type ZItemAttachment = ZoteroAPI.ItemAttachment & ZItemBase;
export type ZItemNote = ZoteroAPI.ItemNote & ZItemBase;
export type ZItemTop = ZoteroAPI.ItemTop & ZItemBase;

export interface ZLibraryContents {
	items: ZItemTop[],
	notes: (ZItemAnnotation | ZItemNote)[],
	pdfs: ZItemAttachment[]
}

export interface ZLibrary {
	apikey: string,
	path: string
}