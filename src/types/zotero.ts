import { ZoteroAPI } from "./externals/zotero";


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

export type ZItem = ZoteroAPI.Item & {
	has_citekey?: boolean
}

export interface ZLibraryContents {
	items: ZoteroAPI.ItemTop[],
	notes: (ZoteroAPI.ItemAnnotation | ZoteroAPI.ItemNote)[],
	pdfs: ZoteroAPI.ItemAttachment[]
}