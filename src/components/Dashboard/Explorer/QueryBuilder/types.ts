import { ZCleanItemPDF, ZCleanItemTop } from "Types/transforms";


export enum InputEnum {
	DATE = "date",
	DATE_RANGE = "date-range",
	ITEM_TAGS = "tags",
	ITEM_TYPE = "item-type",
	SELECT = "select",
	TEXT = "text"
}


export type InputValuesMap = {
	[InputEnum.DATE]: Date,
	[InputEnum.DATE_RANGE]: [Date | null, Date | null],
	[InputEnum.ITEM_TAGS]: string[],
	[InputEnum.ITEM_TYPE]: string[],
	[InputEnum.SELECT]: string,
	[InputEnum.TEXT]: string
};

export type QueryProperty =
	| "Abstract"
	| "Citekey"
	| "DOI"
	| "Item added"
	| "Item type"
	| "Notes"
	| "PDF"
	| "Roam page"
	| "Tags"
	| "Title";

export type QueryTerm = {
	property: QueryProperty,
	relationship: string,
	value: InputValuesMap[keyof InputValuesMap] | null
};

export type QueryTermListRecursive = QueryTerm[] | QueryTermListRecursive[];

export type SupportedItemType = ZCleanItemTop | ZCleanItemPDF;

export type QueryBoxAction =
	| { type: "removeSelf" }
	| { type: "updateSelf", value: (QueryTerm | QueryTermListRecursive)[] };

export type QueryEntryAction =
	| { type: "removeSelf" }
	| { type: "updateSelf", value: QueryTerm | QueryTerm[] };

export type QueryTermAction<T extends QueryTerm | QueryTermListRecursive> =
	| { type: "removeSelf" }
	| { type: "updateSelf", value: T };