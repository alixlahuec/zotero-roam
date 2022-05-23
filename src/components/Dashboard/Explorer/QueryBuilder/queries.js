import React, { useCallback, useContext, useMemo } from "react";
import { any, array, func, oneOf } from "prop-types";

import { UserSettings } from "../../../App";
import { searchEngine } from "../../../../utils";
import InputMultiSelect from "../../../Inputs/InputMultiSelect";
import InputText from "../../../Inputs/InputText";
import TagsSelector from "../../../Inputs/TagsSelector";
import { string } from "prop-types";
import { InputDateRange, InputDateSingle } from "../../../Inputs/InputDate";

const defaultQueryTerm = { property: "Citekey", relationship: "exists", value: null};

const types = ["date", "date-range", "multiselect", "select", "text", null];

const queries = {
	"Abstract": {
		"contains": {
			checkInput: (value) => value && true,
			defaultInput: "",
			inputType: "text",
			testItem: (item, value = "") => {
				if(!item.data.abstractNote){ return false; }
				return searchEngine(value, item.data.abstractNote);
			}
		},
		"does not contain": {
			checkInput: () => true,
			defaultInput: "",
			inputType: "text",
			testItem: (item, value = "") => {
				if(!item.data.abstractNote){ return false; }
				if(!value){ return true; }
				return !searchEngine(value, item.data.abstractNote);
			}
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => !item.data.abstractNote
		},
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.data.abstractNote && true
		}
	},
	"Citekey": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.has_citekey && true
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => !item.has_citekey
		}
	},
	"DOI": {
		"exists": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => item.data.DOI && true
		},
		"does not exist": {
			checkInput: () => false,
			defaultInput: null,
			inputType: null,
			testItem: (item) => !item.data.DOI
		}
	},
	"Item added": {
		"before": {
			checkInput: (value) => value && value.constructor === Date,
			defaultInput: new Date(),
			inputType: "date",
			testItem: (item, value) => item.data.dateAdded < value
		},
		"after": {
			checkInput: (value) => value && value.constructor === Date,
			defaultInput: new Date(),
			inputType: "date",
			testItem: (item, value) => item.data.dateAdded > value
		},
		"between": {
			checkInput: (value) => value.constructor === Array && value.length == 2 && value.every(d => d.constructor === Date || d == null),
			defaultInput: [null, null],
			inputType: "date-range",
			testItem: (item, value) => {
				let [from, to] = value;
				return ((from == null || item.data.dateAdded > from) && (to == null || item.data.dateAdded < to));
			}
		}
	},
	"Item type": {
		"is any of": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			defaultInput: [],
			inputType: "multiselect",
			testItem: (item, value) => value.includes(item.data.itemType)
		},
		"is not": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			defaultInput: [],
			inputType: "multiselect",
			testItem: (item, value) => !value.includes(item.data.itemType)
		}
	},
	// published: {},
	"Tags": {
		"include": {
			checkInput: (value) => value && true,
			defaultInput: [],
			inputType: "multiselect",
			testItem: (item, value = []) => {
				if(item.data.tags.length == 0){ return false; }
				let terms = value.constructor === Array ? value : [value];
				return terms.every(tag => searchEngine(tag, item.data.tags.map(t => t.tag)));
			}
		},
		"include any of": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			defaultInput: [],
			inputType: "multiselect",
			testItem: (item, value = []) => {
				if(item.data.tags.length == 0){ return false; }
				return value.some(tag => searchEngine(tag, item.data.tags.map(t => t.tag))); 
				// TODO: Does the search config need to be adjusted for exact matching ?
			}},
		"do not include": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			defaultInput: [],
			inputType: "multiselect",
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
			inputType: "text",
			testItem: (item, value = "") => searchEngine(value, item.data.title)
		},
		"does not contain": {
			checkInput: (value) => value && true,
			defaultInput: "",
			inputType: "text",
			testItem: (item, value) => !searchEngine(value, item.data.title)
		}
	}
};

/* Evaluation */

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

/* Inputs */

function ItemType({ inputType, value, setValue }){
	const { typemap } = useContext(UserSettings);

	const typeOptions = useMemo(() => {
		return Object.keys(typemap)
			.map(k => ({ value: k, label: typemap[k]}));
	}, [typemap]);

	if(inputType == "multiselect"){
		return <InputMultiSelect options={typeOptions} value={value} setValue={setValue} />;
	}
}
ItemType.propTypes = {
	inputType: oneOf(types),
	setValue: func,
	value: array
};

function ItemTags({ value, setValue }){
	const onSelect = useCallback((tag) => setValue([...value, tag]), [setValue, value]);
	const onRemove = useCallback((tag) => setValue(value.filter(val => val != tag)), [setValue, value]);

	return <TagsSelector onRemove={onRemove} onSelect={onSelect} selectedTags={value} />;
}
ItemTags.propTypes = {
	value: array,
	setValue: func
};

function InputComponent({ property, relationship, value, setValue }){
	const { inputType } = queries[property][relationship];

	if(inputType == null){
		return null;
	} else if(property == "Item type"){
		return <ItemType inputType={inputType} value={value} setValue={setValue} />;
	} else if(property == "Tags"){
		return <ItemTags value={value} setValue={setValue} />;
	} else if(inputType == "date"){
		return <InputDateSingle value={value} setValue={setValue} />;
	} else if(inputType == "date-range"){
		return <InputDateRange value={value} setValue={setValue} />;
	} else if(inputType == "text"){
		return <InputText value={value} setValue={setValue} />;
	}
}
InputComponent.propTypes = {
	property: oneOf(Object.keys(queries)),
	relationship: string,
	value: any,
	setValue: func
};

export {
	defaultQueryTerm,
	queries,
	runQuerySet,
	InputComponent
};
