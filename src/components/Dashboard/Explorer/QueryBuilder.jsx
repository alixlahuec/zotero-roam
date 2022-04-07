import React, { useCallback, useState } from "react";
import { array, func, oneOfType, string } from "prop-types";
import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import { searchEngine } from "../../../utils";

const queries = {
	abstract: {
		"contains": {
			checkInput: (value) => value && true,
			testItem: (item, value = "") => {
				if(!item.data.abstractNote){ return false; }
				return searchEngine(value, item.data.abstractNote);
			}
		},
		"does not contain": {
			checkInput: () => true,
			testItem: (item, value = "") => {
				if(!item.data.abstractNote){ return false; }
				if(!value){ return true; }
				return !searchEngine(value, item.data.abstractNote);
			}
		},
		"does not exist": {
			checkInput: () => true,
			testItem: (item) => !item.data.abstractNote
		},
		"exists": {
			checkInput: () => true,
			testItem: (item) => item.data.abstractNote && true
		}
	},
	added: {
		"before": {
			checkInput: (value) => value && value.constructor === Date,
			testItem: (item, value) => item.data.dateAdded < value
		},
		"after": {
			checkInput: (value) => value && value.constructor === Date,
			testItem: (item, value) => item.data.dateAdded > value
		},
		"between": {
			checkInput: (value) => value.constructor === Array && value.length == 2 && value.every(d => d.constructor === Date),
			testItem: (item, value) => {
				let [from, to] = value;
				return (item.data.dateAdded > from && item.data.dateAdded < to);
			}
		}
	},
	citekey: {
		"exists": {
			checkInput: () => true,
			testItem: (item) => item.has_citekey && true
		},
		"does not exist": {
			checkInput: () => true,
			testItem: (item) => !item.has_citekey
		}
	},
	doi: {
		"exists": {
			checkInput: () => true,
			testItem: (item) => item.data.DOI && true
		},
		"does not exist": {
			checkInput: () => true,
			testItem: (item) => !item.data.DOI
		}
	},
	// published: {},
	tags: {
		"includes": {
			checkInput: (value) => value && true,
			testItem: (item, value = []) => {
				if(item.data.tags.length == 0){ return false; }
				let terms = value.constructor === Array ? value : [value];
				return terms.every(tag => searchEngine(tag, item.data.tags.map(t => t.tag)));
			}
		},
		"includes any of": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			testItem: (item, value = []) => {
				if(item.data.tags.length == 0){ return false; }
				return value.some(tag => searchEngine(tag, item.data.tags.map(t => t.tag))); // TODO: Does the search config need to be adjusted for exact matching ?
			}},
		"does not include": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			testItem: (item, value) => {
				if(item.data.tags.length == 0){ return true; }
				let terms = value.constructor === Array ? value : [value];
				return terms.every(tag => !searchEngine(tag, item.data.tags.map(t => t.tag)));
			}
		}
	},
	title: {
		"contains": {
			checkInput: (value) => value && true,
			testItem: (item, value = "") => searchEngine(value, item.data.title)
		},
		"does not contain": {
			checkInput: (value) => value && true,
			testItem: (item, value) => !searchEngine(value, item.data.title)
		}
	},
	type: {
		"is": {
			checkInput: (value) => value && true,
			testItem: (item, value) => item.data.itemType == value
		},
		"is any of": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			testItem: (item, value) => value.includes(item.data.itemType)
		},
		"is not": {
			checkInput: (value) => value.constructor === Array && value.length > 0,
			testItem: (item, value) => !value.includes(item.data.itemType)
		}
	}
};

function itemRenderer(item, itemProps) {
	const { handleClick, modifiers: { active } } = itemProps;

	return <MenuItem active={active} key={item} onClick={handleClick} text={item} />;
}

function QuerySelector({ property = "title", relationship = "contains", value = "", handleQueryChange } = {}){

	const handlePropertyChange = useCallback((newProp) => {
		if(newProp != property){
			if(Object.keys(queries[newProp]).includes(relationship)){
				handleQueryChange({ 
					property: newProp,
					relationship,
					value 
				});
			} else {
				handleQueryChange({
					property: newProp,
					relationship: Object.keys(queries[newProp])[0],
					value: ""
				});
			}
		}
	}, [property, relationship, value, handleQueryChange]);

	const handleRelationshipChange = useCallback((newRelationship) => {
		if(newRelationship != relationship){
			handleQueryChange({
				property,
				relationship: newRelationship,
				value: (queries[property][newRelationship].checkInput(value) == true) ? value : ""
			});
		}
	}, [property, relationship, value, handleQueryChange]);

	/*const handleValueChange = useCallback((newVal) => {
		handleQueryChange({
			property,
			relationship,
			value: newVal
		});
	}, [property, relationship, handleQueryChange]);*/

	return <div>
		<Select 
			filterable={false} 
			itemRenderer={itemRenderer}
			onItemSelect={handlePropertyChange}
			options={Object.keys(queries)}
		>
			<Button minimal={true} rightIcon="caret-down" text={property} />
		</Select>
		<Select filterable={false} itemRenderer={itemRenderer} onItemSelect={handleRelationshipChange} options={Object.keys(queries[property])}>
			<Button minimal={true} rightIcon="caret-down" text={relationship} />
		</Select>
	</div>;
}
QuerySelector.propTypes = {
	handleQueryChange: func,
	property: string,
	relationship: string,
	value: oneOfType([array, string])
};

function QueryBuilder(){
	const [queriesList, setQueriesList] = useState([{property: "title", relationship: "contains", value: ""}]);
	const handleQueryChange = useCallback((index, update) => {
		setQueriesList(prevState => {
			return [...prevState.slice(0, index), update, ...prevState.slice(index + 1, prevState.length)];
		});
	}, []);

	return <div>
		{queriesList.map((q, ind) => <QuerySelector key={ind} {...q} handleQueryChange={(value) => handleQueryChange(ind, value)} />)}
	</div>;
}

export default QueryBuilder;
