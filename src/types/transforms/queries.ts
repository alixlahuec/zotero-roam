import { parseSemanticDOIs } from "../../api/utils";

import { DataRequest } from "Types/extension";
import { CitoidAPI, SemanticScholarAPI, ZoteroAPI } from "Types/externals";
import { ZItem, ZTagList } from "Types/transforms";


/** CITOID */

export type QueryKeyCitoid = ["citoid", { url: string }];
export type QueryDataCitoid = {
	item: CitoidAPI.AsZotero,
	query: string
};

/** SEMANTIC SCHOLAR */

export type QueryKeySemantic = ["semantic", { doi: string }];
export type QueryDataSemantic = {
	doi: string,
	citations: ReturnType<typeof parseSemanticDOIs<SemanticScholarAPI.RelatedPaper>>,
	references: ReturnType<typeof parseSemanticDOIs<SemanticScholarAPI.RelatedPaper>>
};

/** ZOTERO */

export type QueryKeyCollections = ["collections", { library: string }];
export type QueryDataCollections = {
	data: ZoteroAPI.Collection[],
	lastUpdated: number
};

export type QueryKeyItems = ["items", string, Omit<DataRequest, "apikey" | "library">];
export type QueryDataItems = {
	data: ZItem[],
	lastUpdated: number
};

export type QueryKeyPermissions = ["permissions", { apikey: string }];
export type QueryDataPermissions = ZoteroAPI.Responses.Permissions;

export type QueryKeyTags = ["tags", { library: string }];
export type QueryDataTags = {
	data: ZTagList,
	lastUpdated: number
}