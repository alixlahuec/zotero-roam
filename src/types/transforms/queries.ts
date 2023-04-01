import { ZoteroAPI } from "Types/externals";
import { ZItem } from "Types/transforms";


export type QueryDataCollections = {
	data: ZoteroAPI.Collection[],
	lastUpdated: number
};

export type QueryDataItems = {
	data: ZItem[],
	lastUpdated: number
};

type RoamPage = { title: string, uid: string }
type TagEntry = {
	token: string,
	roam: RoamPage[],
	zotero: ZoteroAPI.Tag[]
}
type TagList = Record<string, TagEntry[]>;

export type QueryDataTags = {
	data: TagList,
	lastUpdated: number
}