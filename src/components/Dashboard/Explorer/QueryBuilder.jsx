import React, { useCallback, useEffect, useState } from "react";
import { array, arrayOf, func, objectOf, oneOf, oneOfType, shape, string } from "prop-types";
import { Button, InputGroup, MenuItem, NonIdealState, Switch } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import { searchEngine } from "../../../utils";
import { ListItem, ListWrapper, Pagination, Toolbar } from "../../DataList";

const defaultQueryTerm = { property: "citekey", relationship: "exists", value: ""};
const itemsPerPage = 20;

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

function itemRenderer(item, itemProps) {
	const { handleClick, modifiers: { active } } = itemProps;

	return <MenuItem active={active} key={item} onClick={handleClick} text={item} />;
}

function QueryEntry({ term, updateSelf, useOR = false }){
    const { property, relationship, value } = term;

    const handlePropChange = useCallback((update) => updateSelf({ ...term, ...update}), [term, updateSelf]);

    const handlePropertyChange = useCallback((newProp) => {
        let updates = { property: newProp };
        // Update relationship also, if necessary
        if(!Object.keys(queries[newProp]).includes(relationship)){ updates.relationship = Object.keys(queries[newProp])[0]; }
        // Update value also, if necessary
        if(updates.relationship && !queries[newProp][updates.relationship].checkInput(value)) { updates.value = ""; }

        handlePropChange(updates);
    }, [handlePropChange, relationship, value]);
    const handleRelationshipChange = useCallback((newRel) => {
        let updates = { relationship: newRel };
        // Update value also, if necessary
        if(!queries[property][newRel].checkInput(value)) { updates.value = ""; }

        handlePropChange(updates);
    }, [handlePropChange, property, value]);
    const handleValueChange = useCallback((newVal) => handlePropChange({ value: newVal }), [handlePropChange]);

	const addSiblingTerm = useCallback(() => updateSelf([term, defaultQueryTerm]), [term, updateSelf]);

    return <div className="zr-query-entry">
        <Select 
			filterable={false} 
			itemRenderer={itemRenderer}
			onItemSelect={handlePropertyChange}
			options={Object.keys(queries)}
		>
			<Button minimal={true} rightIcon="caret-down" text={property} />
		</Select>
        <Select 
            filterable={false} 
            itemRenderer={itemRenderer} 
            onItemSelect={handleRelationshipChange} 
            options={Object.keys(queries[property])}>
			<Button minimal={true} rightIcon="caret-down" text={relationship} />
		</Select>
        <InputGroup onChange={handleValueChange} value={value} />
        <Button minimal={true} onClick={addSiblingTerm} text={"Add term (" + (useOR ? "or" : "and") + ")"} />
    </div>;
}
QueryEntry.propTypes = {
	term: shape({
		property: oneOf(Object.keys(queries)),
		relationship: string,
		value: string
	}),
	updateSelf: func,
	useOR: bool
};

function QueryBox({ handlers, terms = [], useOR = true }){
    const {
        removeSelf,
        addTerm,
        removeTerm,
        updateTerm } = handlers;

    const addChildTerm = useCallback((index) => {
        updateTerm(index, [...terms[index], defaultQueryTerm]);
    }, [terms, updateTerm]);

    const removeChildTerm = useCallback((index, subindex) => {
        let term = terms[index];
        updateTerm(index, [...term.slice(0, subindex), ...term.slice(subindex + 1, term.length)]);
    }, [terms, updateTerm]);

    const updateChildTerm = useCallback((index, subindex, value) => {
        let term = terms[index];
        updateTerm(index, [...term.slice(0, subindex), value, ...term.slice(subindex + 1, term.length)]);
    }, [terms, updateTerm]);

    const makeHandlersForChild = useCallback((index) => {
        return {
            removeSelf: terms.length == 1 ? false : removeTerm(index),
            addTerm: addChildTerm(index),
            removeTerm: removeChildTerm(index),
            updateTerm: (subindex, value) => updateChildTerm(index, subindex, value)
        };
    }, [removeTerm, addChildTerm, removeChildTerm, updateChildTerm, terms]);

    return <div className="zr-query-box">
        {removeSelf
            ? <Button icon="cross" minimal={true} onClick={removeSelf} />
            : null}
        {terms.map((tm, index) => {
            if(tm.constructor === Array){
                let elemHandlers = makeHandlersForChild(index)
                return <QueryBox key={index} handlers={elemHandlers} terms={tm} useOR={!useOR} />;
            } else {
                return <QueryEntry key={index} term={tm} useOR={!useOR} />;
            }
        })}
        <Button minimal={true} onClick={addTerm} text={"Add term (" + (useOR ? "or" : "and") + ")"} />
    </div>;
}
QueryBox.propTypes = {
	handlers: objectOf(func),
	terms: arrayOf(oneOfType([string, array])),
	useOR: bool
}

function QueryBuilder({ items }){
	const [currentPage, setCurrentPage] = useState(1);
    const [useOR, setUseOR] = useState(true);
    const [queryTerms, setQueryTerms] = useState([defaultQueryTerm]);

    const switchOperator = useCallback(() => setUseOR(prev => !prev), []);

    const addQueryTerm = useCallback(() => {
        setQueryTerms(prev => [...prev, defaultQueryTerm]);
    }, []);

    const removeQueryTerm = useCallback((index) => {
        setQueryTerms(prev => [...prev.slice(0,index), ...prev.slice(index + 1, prev.length)]);
    }, []);

    const handleQueryTermChange = useCallback((index, value) => {
        setQueryTerms(prev => [...prev.slice(0, index), value, ...prev.slice(index + 1, prev.length)]);
    }, []);

    const handlers = useMemo(() => {
        return {
            removeSelf: false,
            addTerm: addQueryTerm,
            removeTerm: removeQueryTerm,
            updateTerm: handleQueryTermChange
        };
    }, []);

    const queriedItems = useMemo(() => items.filter(it => runQuerySet(queryTerms, useOR, it)), [queryTerms, useOR]);

	const pageLimits = useMemo(() => [itemsPerPage*(currentPage - 1), itemsPerPage*currentPage], [currentPage]);

	useEffect(() => {
		setCurrentPage(1);
	}, [items, queriedItems]);

    return <div className="zr-query-builder">
		<Toolbar>
			<Switch checked={useOR} label="Start with OR" onChange={switchOperator} />
			<QueryBox 
				handlers={handlers}
				terms={queryTerms}
				useOR={useOR} />
		</Toolbar>
		<ListWrapper>
			{queriedItems.length > 0
				? queriedItems
					.slice(...pageLimits)
					.map((el, i) => <ListItem key={[el.key, i].join("-")}>{el.key}</ListItem>)
				: <NonIdealState className="zr-auxiliary" description="No items to display" />}
		</ListWrapper>
		<Toolbar>
			<Pagination 
				currentPage={currentPage} 
				itemsPerPage={itemsPerPage} 
				nbItems={queriedItems.length} 
				setCurrentPage={setCurrentPage} 
			/>
		</Toolbar>
    </div>;
}
QueryBuilder.propTypes = {
	items: array
};

export default QueryBuilder;
