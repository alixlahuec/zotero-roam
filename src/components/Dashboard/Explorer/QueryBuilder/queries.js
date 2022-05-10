import { searchEngine } from "../../../../utils";

const defaultQueryTerm = { property: "Citekey", relationship: "exists", value: null};

const queries = {
	"Abstract": {
		"contains": {
			checkInput: (value) => value && true,
			defaultInput: "",
			testItem: (item, value = "") => {
				if(!item.data.abstractNote){ return false; }
				return searchEngine(value, item.data.abstractNote);
			}
		},
		"does not contain": {
			checkInput: () => true,
			defaultInput: "",
			testItem: (item, value = "") => {
				if(!item.data.abstractNote){ return false; }
				if(!value){ return true; }
				return !searchEngine(value, item.data.abstractNote);
			}
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			testItem: (item) => !item.data.abstractNote
		},
		"exists": {
			checkInput: () => true,
			defaultInput: null,
			testItem: (item) => item.data.abstractNote && true
		}
	},
	"Citekey": {
		"exists": {
			checkInput: () => true,
			defaultInput: null,
			testItem: (item) => item.has_citekey && true
		},
		"does not exist": {
			checkInput: () => true,
			defaultInput: null,
			testItem: (item) => !item.has_citekey
		}
	},
	"DOI": {
		"exists": {
			checkInput: () => true,
			defaultInput: null,
			testItem: (item) => item.data.DOI && true
		},
		"does not exist": {
			checkInput: () => true,
			defaultInput: null,
			testItem: (item) => !item.data.DOI
		}
	},
	"Item added": {
		"before": {
			checkInput: (value) => value && value.constructor === Date,
			defaultInput: new Date(),
			testItem: (item, value) => item.data.dateAdded < value
		},
		"after": {
			checkInput: (value) => value && value.constructor === Date,
			defaultInput: new Date(),
			testItem: (item, value) => item.data.dateAdded > value
		},
		"between": {
			checkInput: (value) => value.constructor === Array && value.length == 2 && value.every(d => d.constructor === Date),
			defaultInput: [new Date(), new Date()],
			testItem: (item, value) => {
				let [from, to] = value;
				return (item.data.dateAdded > from && item.data.dateAdded < to);
			}
		}
	},
	"Item type": {
		"is": {
			checkInput: (value) => value && true,
			defaultInput: "journalArticle",
			testItem: (item, value) => item.data.itemType == value
		},
		"is any of": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			defaultInput: [],
			testItem: (item, value) => value.includes(item.data.itemType)
		},
		"is not": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			defaultInput: [],
			testItem: (item, value) => !value.includes(item.data.itemType)
		}
	},
	// published: {},
	"Tags": {
		"include": {
			checkInput: (value) => value && true,
			defaultInput: [],
			testItem: (item, value = []) => {
				if(item.data.tags.length == 0){ return false; }
				let terms = value.constructor === Array ? value : [value];
				return terms.every(tag => searchEngine(tag, item.data.tags.map(t => t.tag)));
			}
		},
		"include any of": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			defaultInput: [],
			testItem: (item, value = []) => {
				if(item.data.tags.length == 0){ return false; }
				return value.some(tag => searchEngine(tag, item.data.tags.map(t => t.tag))); // TODO: Does the search config need to be adjusted for exact matching ?
			}},
		"do not include": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			defaultInput: [],
			testItem: (item, value) => {
				if(item.data.tags.length == 0){ return true; }
				let terms = value.constructor === Array ? value : [value];
				return terms.every(tag => !searchEngine(tag, item.data.tags.map(t => t.tag)));
			}
		}
	},
	"Title": {
		"contains": {
			checkInput: (value) => value && true,
			defaultInput: "",
			testItem: (item, value = "") => searchEngine(value, item.data.title)
		},
		"does not contain": {
			checkInput: (value) => value && true,
			defaultInput: "",
			testItem: (item, value) => !searchEngine(value, item.data.title)
		}
	}
};

function runQueryTerm(term, useOR = false, item){
	if(term.constructor === Array){
		return runQuerySet(term, useOR, item);
	} else if(term.constructor === Object){
		let { property, relationship, value = "" } = term;
		if(!property || !relationship){ 
			return true; 
		} else {
			let { checkInput, testItem } = queries[property][relationship];
			if(checkInput(value)){
				return testItem(item, value);
			} else {
				return true;
			}
		}
	} else {
		throw new Error("Unexpected query input of type " + term.constructor, ", expected Array or Object");
	}
}

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
	runQuerySet
};
