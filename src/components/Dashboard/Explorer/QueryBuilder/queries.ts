import { makeDNP, searchEngine } from "../../../../utils";
import { ZCleanItemPDF, ZCleanItemTop } from "Types/transforms";


export type QueryTerm<T extends QueryInputType | null = QueryInputType | null> = {
	property: string,
	relationship: string,
	value: T extends QueryInputType ? QueryValueTypes[T] : null
};

enum QueryInputType {
	DATE = "date",
	DATE_RANGE = "date-range",
	MULTISELECT = "multiselect",
	SELECT = "select",
	TEXT = "text"
}

type QueryValueTypes = {
	[QueryInputType.DATE]: Date | null,
	[QueryInputType.DATE_RANGE]: [Date | null, Date | null],
	[QueryInputType.MULTISELECT]: string[],
	[QueryInputType.SELECT]: string,
	[QueryInputType.TEXT]: string
};

type SupportedItemType = ZCleanItemTop | ZCleanItemPDF;

type QueryOperatorWithValue<T extends QueryInputType> = {
	checkInput: (value: any) => boolean,
	defaultInput: QueryValueTypes[T],
	inputType: T,
	testItem: (item: SupportedItemType, value: QueryValueTypes[T]) => boolean
} & (QueryValueTypes[T] extends string ? object : { stringify: (value: QueryValueTypes[T]) => string })

type QueryOperatorWithoutValue = {
	checkInput: () => boolean,
	defaultInput: null,
	inputType: null,
	testItem: (item: SupportedItemType) => boolean
};

type QueryOperator<T extends QueryInputType | null> = T extends QueryInputType ? QueryOperatorWithValue<T> : QueryOperatorWithoutValue;

const defaultQueryTerm: QueryTerm<null> = { property: "Citekey", relationship: "exists", value: null };

// TODO: delete this once InputComponent has been converted to TS
const types = ["date", "date-range", "multiselect", "select", "text", null];

const queries: Record<string, Record<string, QueryOperator<QueryInputType | null>>> = {
	"Abstract": {
		"contains": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: QueryInputType.TEXT,
			testItem: (item: ZCleanItemTop, value = "") => {
				if(!item.abstract){ return false; }
				return searchEngine(value, item.abstract);
			}
		},
		"does not contain": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: QueryInputType.TEXT,
			testItem: (item: ZCleanItemTop, value = "") => {
				if(!item.abstract){ return false; }
				if(!value){ return true; }
				return !searchEngine(value, item.abstract);
			}
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => !item.abstract
		},
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => Boolean(item.abstract)
		}
	},
	"Citekey": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => Boolean(item.raw.has_citekey)
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => !item.raw.has_citekey
		}
	},
	"DOI": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => Boolean(item.raw.data.DOI)
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => !item.raw.data.DOI
		}
	},
	"Item added": {
		"before": {
			checkInput: (value) => value instanceof Date,
			defaultInput: new Date(),
			inputType: QueryInputType.DATE,
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
		},
		"after": {
			checkInput: (value) => value instanceof Date,
			defaultInput: new Date(),
			inputType: QueryInputType.DATE,
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
		},
		"between": {
			checkInput: (value) => value?.constructor === Array && value.length == 2 && value.every(d => d == null || d?.constructor === Date),
			defaultInput: [null, null],
			inputType: QueryInputType.DATE_RANGE,
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
		}
	},
	"Item type": {
		"is any of": {
			checkInput: (value) => value?.constructor === Array && value.length > 0 && value.every(el => el?.constructor === String),
			defaultInput: [],
			inputType: QueryInputType.MULTISELECT,
			stringify: (value) => value.join(", "),
			testItem: (item: ZCleanItemTop, value) => value.includes(item.itemType)
		},
		"is not": {
			checkInput: (value) => value?.constructor === Array && value.length > 0 && value.every(el => el?.constructor === String),
			defaultInput: [],
			inputType: QueryInputType.MULTISELECT,
			stringify: (value) => value.join(", "),
			testItem: (item: ZCleanItemTop, value) => !value.includes(item.itemType)
		}
	},
	"Notes": {
		"exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.children.notes.length > 0 // TODO: support PDF children
		},
		"do not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.children.notes.length == 0 // TODO: support PDF children
		}
	},
	"PDF": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.children.pdfs.length > 0
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.children.pdfs.length == 0
		}
	},
	"Roam page": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => Boolean(item.inGraph)
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item: ZCleanItemTop) => item.inGraph == false
		}
	},
	"Tags": {
		"include": {
			checkInput: (value) => value?.constructor === Array && (value.length == 0 || value.every(el => el?.constructor === String)),
			defaultInput: [],
			inputType: QueryInputType.MULTISELECT,
			stringify: (value) => value.join(", "),
			testItem: (item, value = []) => {
				if(item.tags.length == 0 || value.length == 0){ return false; }
				return value.every(tag => searchEngine(tag, item.tags, { match: "exact" }));
			}
		},
		"include any of": {
			checkInput: (value) => value?.constructor === Array && (value.length == 0 || value.every(el => el?.constructor === String)),
			defaultInput: [],
			inputType: QueryInputType.MULTISELECT,
			stringify: (value) => value.join(", "),
			testItem: (item, value = []) => {
				if(item.tags.length == 0 || value.length == 0){ return false; }
				return value.some(tag => searchEngine(tag, item.tags, { match: "exact" }));
			} },
		"do not include": {
			checkInput: (value) => value?.constructor === Array && (value.length == 0 || value.every(el => el?.constructor === String)),
			defaultInput: [],
			inputType: QueryInputType.MULTISELECT,
			stringify: (value) => value.join(", "),
			testItem: (item, value) => {
				if(item.tags.length == 0 || value.length == 0){ return true; }
				return value.every(tag => !searchEngine(tag, item.tags, { match: "exact" }));
			}
		}
	},
	"Title": {
		"contains": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: QueryInputType.TEXT,
			testItem: (item, value = "") => searchEngine(value, item.title)
		},
		"does not contain": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: QueryInputType.TEXT,
			testItem: (item, value) => !searchEngine(value, item.title)
		}
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
			const operator = queries[property][relationship];
			if (operator.inputType === null) {
				return operator.testItem(item);
			} else {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore 
				return operator.testItem(item, value); // TODO: Fix typing of `value`
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
	runQuerySet,
	types
};
