import { ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "./zotero";


type SLinkType = "arxiv" | "connected-papers" | "google-scholar" | "semantic-scholar";

export interface SCleanItem {
	authors: string,
	authorsLastNames: string[],
	authorsString: string,
	doi: string | false,
	intent: string[],
	isInfluential: boolean,
	links: (Record<SLinkType, string> | Record<string, never>),
	meta: string,
	title: string,
	url: string,
	year: string,
	_multiField: string
}

export interface SCleanRelatedItem {
	abstract: string,
	added: string,
	children: {
		notes: (ZItemAnnotation | ZItemNote)[],
		pdfs: ZItemAttachment[]
	},
	inGraph: string | false,
	itemType: ZItemTop["data"]["itemType"],
	key: string,
	location: string,
	meta: string,
	raw: ZItemTop,
	timestamp: string,
	title: string
}

interface SEnrichedItemBase extends SCleanItem {
	inGraph: false | string,
	_type?: "citing" | "cited"
}

export interface SEnrichedItemInLibrary extends SEnrichedItemBase {
	inLibrary: {
		children: { notes: (ZItemAnnotation | ZItemNote)[], pdfs: ZItemAttachment[] },
		raw: ZItemTop
	}
}
export const isSBacklink = (item: SEnrichedItem): item is SEnrichedItemInLibrary => item.inLibrary != false;

interface SEnrichedItemOutsideLibrary extends SEnrichedItemBase {
	inLibrary: false
}

export type SEnrichedItem = SEnrichedItemInLibrary | SEnrichedItemOutsideLibrary;

export interface SRelatedEntries {
	citations: SEnrichedItem[],
	references: SEnrichedItem[],
	backlinks: SEnrichedItemInLibrary[]
}