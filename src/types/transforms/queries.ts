import { DataRequest } from "Types/extension";
import { ZoteroAPI } from "Types/externals";
import { ZItem, ZTagList } from "Types/transforms";


export type QueryKeyCollections = ["collections", { library: string }];
export type QueryDataCollections = {
	data: ZoteroAPI.Collection[],
	lastUpdated: number
};

export type QueryKeyItems = ["items", Omit<DataRequest, "apikey" | "library">];
export type QueryDataItems = {
	data: ZItem[],
	lastUpdated: number
};

export type QueryKeyTags = ["tags", { library: string }];
export type QueryDataTags = {
	data: ZTagList,
	lastUpdated: number
}