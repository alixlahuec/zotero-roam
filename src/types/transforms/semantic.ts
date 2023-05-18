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

export enum SEnrichedItemTypeEnum {
	CITED = "cited",
	CITING = "citing"
}

interface SEnrichedItemBase extends SCleanItem {
	inGraph: false | string,
	_type?: SEnrichedItemTypeEnum
}

export interface SEnrichedItemInLibrary extends SEnrichedItemBase {
	inLibrary: {
		children: { notes: (ZItemAnnotation | ZItemNote)[], pdfs: ZItemAttachment[] },
		raw: ZItemTop
	}
}

interface SEnrichedItemOutsideLibrary extends SEnrichedItemBase {
	inLibrary: false
}

type SEnrichedItemWithLibrary = SEnrichedItemInLibrary | SEnrichedItemOutsideLibrary;
export type SEnrichedItemCitation = SEnrichedItemWithLibrary /*& { _type: SEnrichedItemTypeEnum.CITING }*/
export type SEnrichedItemReference = SEnrichedItemWithLibrary /*& { _type: SEnrichedItemTypeEnum.CITED }*/
export type SEnrichedItem = SEnrichedItemCitation | SEnrichedItemReference;
export const isSBacklink = (item: SEnrichedItem): item is SEnrichedItemInLibrary => item.inLibrary != false;
export const isSCitation = (item: SEnrichedItem): item is SEnrichedItemCitation => item._type == SEnrichedItemTypeEnum.CITING;
export const isSReference = (item: SEnrichedItem): item is SEnrichedItemReference => item._type == SEnrichedItemTypeEnum.CITED;

export interface SRelatedEntries {
	citations: SEnrichedItemCitation[],
	references: SEnrichedItemReference[],
	backlinks: SEnrichedItemInLibrary[]
}