import { ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "./zotero";
import { ZoteroAPI } from "Types/externals";


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

export interface SEnrichedItem extends SCleanItem {
	inGraph: false | string,
	inLibrary: false | {
		children: { notes: (ZoteroAPI.ItemAnnotation | ZoteroAPI.ItemNote)[], pdfs: ZoteroAPI.ItemAttachment[] },
		raw: ZoteroAPI.ItemTop
	},
	_type?: "citing" | "cited"
}

export interface SRelatedEntries {
	citations: SEnrichedItem[],
	references: SEnrichedItem[],
	backlinks: SEnrichedItem[]
}