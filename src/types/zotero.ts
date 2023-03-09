import { ZoteroItemAnnotation, ZoteroItemAttachment, ZoteroItemNote, ZoteroItemTop } from "./externals/zotero";


export interface ZLibraryContents {
	items: ZoteroItemTop[],
	notes: (ZoteroItemAnnotation | ZoteroItemNote)[],
	pdfs: ZoteroItemAttachment[]
}