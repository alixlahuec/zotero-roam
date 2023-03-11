import { ZoteroItem, ZoteroItemAnnotation, ZoteroItemAttachment, ZoteroItemNote, ZoteroItemTop, ZoteroItemTopType } from "./externals/zotero";


export interface ZCleanItemTop {
	abstract: string,
	authors: string,
	authorsFull: string[],
	authorsLastNames: string[],
	authorsRoles: string[],
	children: {
		notes: (ZoteroItemAnnotation|ZoteroItemNote)[],
		pdfs: ZoteroItemAttachment[]
	},
	createdByUser: string | null,
	inGraph: string | false,
	itemKey: string,
	itemType: ZoteroItemTopType,
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
	raw: ZoteroItemTop
}

export interface ZCleanItemPDF {
	annotations: ZoteroItemAnnotation[],
	key: string,
	link: string,
	parent: ZoteroItemTop | Record<string, never>,
	title: string,
	raw: ZoteroItemAttachment
}

export type ZItem = ZoteroItem & {
	has_citekey?: boolean
}

export interface ZLibraryContents {
	items: ZoteroItemTop[],
	notes: (ZoteroItemAnnotation | ZoteroItemNote)[],
	pdfs: ZoteroItemAttachment[]
}