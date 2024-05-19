import { makeDNP } from "@services/roam";
import { searchEngine } from "../../../../utils";
import { InputEnum, InputValuesMap, QueryProperty, QueryTerm, SupportedItemType } from "./types";
import { ZCleanItemTop } from "Types/transforms";


type QueryOperatorWithValue<T extends InputEnum> = {
	checkInput: (value: any) => boolean,
	defaultInput: InputValuesMap[T],
	inputType: T,
	stringify?: (value: InputValuesMap[T]) => string,
	testItem: (item: SupportedItemType, value: InputValuesMap[T]) => boolean
} & (InputValuesMap[T] extends string ? object : { stringify: (value: InputValuesMap[T]) => string })

type QueryOperatorWithoutValue = {
	checkInput: () => boolean,
	defaultInput: null,
	inputType: null,
	stringify?: (value: null) => string,
	testItem: (item: SupportedItemType) => boolean
};

export type QueryOperator<T extends InputEnum | null = InputEnum | null> = T extends InputEnum ? QueryOperatorWithValue<T> : QueryOperatorWithoutValue;

const defaultQueryTerm: QueryTerm = { property: "Citekey", relationship: "exists", value: null };

const queries: Record<QueryProperty, Record<string, QueryOperator>> = {
	"Abstract": {
		"contains": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: InputEnum.TEXT,
			testItem: (item: ZCleanItemTop, value = "") => {
				if(!item.abstract){ return false; }
				return searchEngine(value, item.abstract);
			}
		} as QueryOperator<InputEnum.TEXT>,
		"does not contain": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: InputEnum.TEXT,
			testItem: (item: ZCleanItemTop, value = "") => {
				if(!item.abstract){ return false; }
				if(!value){ return true; }
				return !searchEngine(value, item.abstract);
			}
		} as QueryOperator<InputEnum.TEXT>,
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => !item.abstract
		} as QueryOperator<null>,
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => Boolean(item.abstract)
		} as QueryOperator<null>
	},
	"Citekey": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => Boolean(item.raw.has_citekey)
		} as QueryOperator<null>,
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => !item.raw.has_citekey
		} as QueryOperator<null>
	},
	"DOI": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => Boolean(item.raw.data.DOI)
		} as QueryOperator<null>,
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => !item.raw.data.DOI
		} as QueryOperator<null>
	},
	"Item added": {
		"before": {
			checkInput: (value) => value instanceof Date,
			defaultInput: new Date(),
			inputType: InputEnum.DATE,
			stringify: (value) => makeDNP(value, { brackets: false }),
			testItem: (item, value) => {
				if(value == null){
					return true;
				} else {
					const dateCheck = value;
					dateCheck.setHours(0,0,0);
					return new Date(item.raw.data.dateAdded) < dateCheck;
				}
			}
		} as QueryOperator<InputEnum.DATE>,
		"after": {
			checkInput: (value) => value instanceof Date,
			defaultInput: new Date(),
			inputType: InputEnum.DATE,
			stringify: (value) => makeDNP(value, { brackets: false }),
			testItem: (item, value) => {
				if(value == null){
					return true;
				} else {
					const dateCheck = value;
					dateCheck.setHours(0,0,0);
					return new Date(item.raw.data.dateAdded) > dateCheck;
				}
			}
		} as QueryOperator<InputEnum.DATE>,
		"between": {
			checkInput: (value) => value?.constructor === Array && value.length == 2 && value.every(d => d == null || d?.constructor === Date),
			defaultInput: [null, null],
			inputType: InputEnum.DATE_RANGE,
			stringify: (value) => {
				return value.map(val => {
					return val ? makeDNP(val, { brackets: false }) : "...";
				}).join("-");
			},
			testItem: (item, value) => {
				const [from, to] = value;
				let afterFrom: boolean
					, beforeTo: boolean;
				
				if(from == null){
					afterFrom = true;
				} else {
					const fromCheck = from;
					fromCheck.setHours(0,0,0);
					afterFrom = new Date(item.raw.data.dateAdded) > fromCheck;
				}

				if(to == null){
					beforeTo = true;
				} else {
					const toCheck = to;
					toCheck.setHours(0,0,0);
					beforeTo = new Date(item.raw.data.dateAdded) < toCheck;
				}
				
				return (afterFrom && beforeTo);
			}
		} as QueryOperator<InputEnum.DATE_RANGE>
	},
	"Item type": {
		"is any of": {
			checkInput: (value) => value?.constructor === Array && value.length > 0 && value.every(el => el?.constructor === String),
			defaultInput: [],
			inputType: InputEnum.ITEM_TYPE,
			stringify: (value) => value.join(", "),
			testItem: (item: ZCleanItemTop, value) => value.includes(item.itemType)
		} as QueryOperator<InputEnum.ITEM_TYPE>,
		"is not": {
			checkInput: (value) => value?.constructor === Array && value.length > 0 && value.every(el => el?.constructor === String),
			defaultInput: [],
			inputType: InputEnum.ITEM_TYPE,
			stringify: (value) => value.join(", "),
			testItem: (item: ZCleanItemTop, value) => !value.includes(item.itemType)
		} as QueryOperator<InputEnum.ITEM_TYPE>
	},
	"Notes": {
		"exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.children.notes.length > 0 // TODO: support PDF children
		} as QueryOperator<null>,
		"do not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.children.notes.length == 0 // TODO: support PDF children
		} as QueryOperator<null>
	},
	"PDF": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.children.pdfs.length > 0
		} as QueryOperator<null>,
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.children.pdfs.length == 0
		} as QueryOperator<null>
	},
	"Roam page": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => Boolean(item.inGraph)
		} as QueryOperator<null>,
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.inGraph == false
		} as QueryOperator<null>
	},
	"Tags": {
		"include": {
			checkInput: (value) => value?.constructor === Array && (value.length == 0 || value.every(el => el?.constructor === String)),
			defaultInput: [],
			inputType: InputEnum.ITEM_TAGS,
			stringify: (value) => value.join(", "),
			testItem: (item, value = []) => {
				if(item.tags.length == 0 || value.length == 0){ return false; }
				return value.every(tag => searchEngine(tag, item.tags, { match: "exact" }));
			}
		} as QueryOperator<InputEnum.ITEM_TAGS>,
		"include any of": {
			checkInput: (value) => value?.constructor === Array && (value.length == 0 || value.every(el => el?.constructor === String)),
			defaultInput: [],
			inputType: InputEnum.ITEM_TAGS,
			stringify: (value) => value.join(", "),
			testItem: (item, value = []) => {
				if(item.tags.length == 0 || value.length == 0){ return false; }
				return value.some(tag => searchEngine(tag, item.tags, { match: "exact" }));
			}
		} as QueryOperator<InputEnum.ITEM_TAGS>,
		"do not include": {
			checkInput: (value) => value?.constructor === Array && (value.length == 0 || value.every(el => el?.constructor === String)),
			defaultInput: [],
			inputType: InputEnum.ITEM_TAGS,
			stringify: (value) => value.join(", "),
			testItem: (item, value) => {
				if(item.tags.length == 0 || value.length == 0){ return true; }
				return value.every(tag => !searchEngine(tag, item.tags, { match: "exact" }));
			}
		} as QueryOperator<InputEnum.ITEM_TAGS>
	},
	"Title": {
		"contains": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: InputEnum.TEXT,
			testItem: (item, value = "") => searchEngine(value, item.title)
		} as QueryOperator<InputEnum.TEXT>,
		"does not contain": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: InputEnum.TEXT,
			testItem: (item, value) => !searchEngine(value, item.title)
		} as QueryOperator<InputEnum.TEXT>
	}
};

type QueryTermRecursive = QueryTerm | (QueryTerm|QueryTermRecursive)[];

/** Evaluates a query term (predicate or group) against an item
 * @param term - The term to evaluate
 * @param useOR - If the term is a group, is it an `OR` group? If `false`, it is treated as an `AND` group.
 * @param item - The item against which to evaluate the term
 * @returns The result of the term evaluation for the item
 */
function runQueryTerm(term: QueryTermRecursive, useOR = false, item: ZCleanItemTop): boolean{
	if(Array.isArray(term)){
		return runQuerySet(term, useOR, item);
	} else if(typeof(term) == "object"){
		const { property, relationship, value } = term;
		if(!property || !relationship){ 
			return true; 
		} else {
			const operator = queries[property][relationship] as QueryOperator;
			if (operator.inputType === null) {
				return operator.testItem(item);
			} else {
				return operator.testItem(item, value as any);
			}
		}
	} else {
		throw new Error(`Unexpected query input of type ${typeof(term)}, expected Array or Object`);
	}
}

/** Runs a query against an item
 * @param terms - The terms of the query
 * @param useOR - If the top-level operator is "or"
 * @param item - The target item
 * @returns The result of the query evaluation for the item
 */
function runQuerySet(terms: QueryTermRecursive[] = [], useOR = true, item: ZCleanItemTop): boolean{
	if(terms.length == 0){
		return true;
	} else {
		if(useOR){
			return terms.some(tm => runQueryTerm(tm, !useOR, item));
		} else {
			return terms.every(tm => runQueryTerm(tm, !useOR, item));
		}
	}
}

export {
	defaultQueryTerm,
	queries,
	runQuerySet
};
