import { CitoidAPI } from "@clients/citoid";
import { SemanticScholarAPI } from "@clients/semantic";
import { ZoteroAPI } from "@clients/zotero";

import { transformDOIs } from "../../utils";

import { DataRequest } from "Types/extension";
import { ZItem, ZTagList } from "Types/transforms";


export type SelectItemCollectionsOptions = { brackets: boolean, return_as: "array" | "string" };

export type SelectItemRelatedOptions = { brackets: boolean, return_as: "array" | "raw" | "string" };

export type SelectItemsOption = "all" | "annotations" | "attachments" | "children" | "items" | "notes" | "pdfs";

export namespace Queries {
	export namespace Key {
		export type Citoid = ["citoid", { url: string }];
		export type Semantic = ["semantic", { doi: string }];
		export type Collections = ["collections", { library: string }];
		export type Items = ["items", string, Omit<DataRequest, "apikey" | "library">];
		export type Permissions = ["permissions", { apikey: string }];
		export type Tags = ["tags", { library: string }];
	}

	export namespace Data {
		export type Citoid = {
			item: CitoidAPI.AsZotero,
			query: string
		};

		export type Semantic = {
			doi: string,
			// TODO: simplify with a type helper
			citations: ReturnType<typeof transformDOIs<SemanticScholarAPI.RelatedPaper>>,
			references: ReturnType<typeof transformDOIs<SemanticScholarAPI.RelatedPaper>>
		};

		export type Collections = {
			data: ZoteroAPI.Collection[],
			lastUpdated: number
		};

		export type Items = {
			data: ZItem[],
			lastUpdated: number
		};

		export type Permissions = ZoteroAPI.Responses.Permissions;

		export type Tags = {
			data: ZTagList,
			lastUpdated: number
		}
	}
}