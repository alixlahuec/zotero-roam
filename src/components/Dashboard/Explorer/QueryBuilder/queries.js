import { searchEngine } from "../../../../utils";

const defaultQueryTerm = { property: "Citekey", relationship: "exists", value: null };

const types = ["date", "date-range", "multiselect", "select", "text", null];

const queries = {
	"Abstract": {
		"contains": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: "text",
			testItem: (item, value = "") => {
				if(!item.abstract){ return false; }
				return searchEngine(value, item.abstract);
			}
		},
		"does not contain": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: "text",
			testItem: (item, value = "") => {
				if(!item.abstract){ return false; }
				if(!value){ return true; }
				return !searchEngine(value, item.abstract);
			}
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => !item.abstract
		},
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.abstract && true
		}
	},
	"Citekey": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.raw.has_citekey && true
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
			testItem: (item) => item.raw.data.DOI && true
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => !item.raw.data.DOI
		}
	},
	"Item added": {
		"before": {
			checkInput: (value) => value && value?.constructor === Date,
			defaultInput: new Date(),
			inputType: "date",
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
			checkInput: (value) => value && value.constructor === Date,
			defaultInput: new Date(),
			inputType: "date",
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
			inputType: "date-range",
			testItem: (item, value) => {
				const [from, to] = value;
				let afterFrom
					, beforeTo;
				
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
			inputType: "multiselect",
			testItem: (item, value) => value.includes(item.itemType)
		},
		"is not": {
			checkInput: (value) => value?.constructor === Array && value.length > 0 && value.every(el => el?.constructor === String),
			defaultInput: [],
			inputType: "multiselect",
			testItem: (item, value) => !value.includes(item.itemType)
		}
	},
	"Notes": {
		"exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.children.notes.length > 0
		},
		"do not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.children.notes.length == 0
		}
	},
	"PDF": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.children.pdfs.length > 0
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.children.pdfs.length == 0
		}
	},
	"Roam page": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.inGraph && true
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.inGraph == false
		}
	},
	// published: {},
	"Tags": {
		"include": {
			checkInput: (value) => value?.constructor === Array && (value.length == 0 || value.every(el => el?.constructor === String)),
			defaultInput: [],
			inputType: "multiselect",
			testItem: (item, value = []) => {
				if(item.tags.length == 0 || value.length == 0){ return false; }
				return value.every(tag => searchEngine(tag, item.tags, { match: "exact" }));
			}
		},
		"include any of": {
			checkInput: (value) => value?.constructor === Array && (value.length == 0 || value.every(el => el?.constructor === String)),
			defaultInput: [],
			inputType: "multiselect",
			testItem: (item, value = []) => {
				if(item.tags.length == 0 || value.length == 0){ return false; }
				return value.some(tag => searchEngine(tag, item.tags, { match: "exact" }));
			} },
		"do not include": {
			checkInput: (value) => value?.constructor === Array && (value.length == 0 || value.every(el => el?.constructor === String)),
			defaultInput: [],
			inputType: "multiselect",
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
			inputType: "text",
			testItem: (item, value = "") => searchEngine(value, item.title)
		},
		"does not contain": {
			checkInput: (value) => value?.constructor === String,
			defaultInput: "",
			inputType: "text",
			testItem: (item, value) => !searchEngine(value, item.title)
		}
	}
};

/* Evaluation */

function runQueryTerm(term, useOR = false, item){
	if(term.constructor === Array){
		return runQuerySet(term, useOR, item);
	} else if(term.constructor === Object){
		const { property, relationship, value } = term;
		if(!property || !relationship){ 
			return true; 
		} else {
			const { testItem } = queries[property][relationship];
			return testItem(item, value);
		}
	} else {
		throw new Error("Unexpected query input of type " + term.constructor, ", expected Array or Object");
	}
}

/** Runs a query against an item
 * @param {Array} terms - The terms of the query
 * @param {Boolean} useOR - If the top-level operator is "or"
 * @param {Object} item - The target item (of type `cleanLibraryItemType`)
 * @returns {Boolean} The result of the query for this item
 */
function runQuerySet(terms = [], useOR = true, item){
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
