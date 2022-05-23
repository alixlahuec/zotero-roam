import React, { useCallback, useMemo, useState } from "react";
import { array, bool, func, shape } from "prop-types";
import { Button, Classes, Dialog, Tag } from "@blueprintjs/core";

import QueryBox from "./QueryBox";
import { defaultQueryTerm } from "./queries";
import { removeArrayElemAt, returnSiblingArray, updateArrayElemAt } from "./utils";
import { makeDNP } from "../../../../utils";

function makeValueString(value){
	if(value == null){
		return "...";
	} else if(value.constructor == Date){
		return makeDNP(value, { brackets: false });
	} else {
		return `${value}`;
	}
}

function joinTerm(term){
	const {property, relationship, value} = term;
	const valueString = value == null
		? ""
		: value?.constructor == Array 
			? (value.map(val => makeValueString(val)).join(" - ")) 
			: makeValueString(value);
	return [property, relationship, valueString].filter(Boolean).join(" ");
}

function makeTermString(term, useOR, { parentheses = true } = {}){
	if(term.constructor === Object){
		return joinTerm(term);
	} else {
		let output = term
			.map(tm => makeTermString(tm, !useOR))
			.join(useOR ? " or " : " and ");
		return parentheses ? `(${output})` : output;
	}
}

function TermTag({ handlers, isLast, term, useOR }){
	const { removeSelf, updateSelf } = handlers;
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const openDialog = useCallback(() => setIsDialogOpen(true), []);
	const closeDialog = useCallback(() => setIsDialogOpen(false), []);

	const removeSelfCleanly = useCallback(() => {
		closeDialog();
		removeSelf();
	}, [closeDialog, removeSelf]);

	const handlersForDialog = useMemo(() => {
		return {
			removeSelf: () => removeSelfCleanly(),
			updateSelf
		};
	}, [removeSelfCleanly, updateSelf]);

	return <>
		<Tag zr-role="filter-tag" interactive={true} minimal={true} onClick={openDialog} onRemove={removeSelf} >
			{makeTermString(term, !useOR, { parentheses: false })}
		</Tag>
		{!isLast && <span className="zr-auxiliary" zr-role="filter-operator">{useOR ? "OR" : "AND"}</span>}
		<Dialog canEscapeKeyClose={false} className="zr-query-term-dialog" isOpen={isDialogOpen} lazy={true} onClose={closeDialog} >
			<div className={Classes.DIALOG_BODY}>
				<QueryBox handlers={handlersForDialog} isFirstChild={true} isLastChild={true} isOnlyChild={true} terms={term} useOR={!useOR} />
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button minimal={true} onClick={removeSelfCleanly} text="Remove term" />
					<Button intent="primary" minimal={true} onClick={closeDialog} text="OK" />
				</div>
			</div>
		</Dialog>
	</>;
}
TermTag.propTypes = {
	handlers: shape({
		removeSelf: func,
		updateSelf: func
	}),
	isLast: bool,
	term: array,
	useOR: bool
};

function FilterElements({ filter, handlers, useOR }){
	const { removeTerm, updateTerm } = handlers;

	const makeHandlersForChild = useCallback((index) => {
		return {
			removeSelf: () => removeTerm(index),
			updateSelf: (value) => updateTerm(index, value)
		};
	}, [removeTerm, updateTerm]);
	
	return filter.map((term, index) => {
		let elemHandlers = makeHandlersForChild(index);
		return <TermTag key={index} handlers={elemHandlers} isLast={index == filter.length - 1} term={term} useOR={useOR} />;
	});
}
FilterElements.propTypes = {
	filter: array,
	handlers: shape({
		removeTerm: func,
		updateTerm: func
	}),
	useOR: bool
};

function Filter({ filter, handlers, isOnlyChild, useOR }){
	const { removeSelf, addTerm, removeTerm, updateTerm } = handlers;

	const handlersForChild = useMemo(() => {
		return {
			removeTerm: (index) => {
				if(filter.length == 1){
					removeSelf();
				} else {
					removeTerm(index);
				}
			},
			updateTerm
		};
	}, [filter.length, removeSelf, removeTerm, updateTerm]);

	return <>
		<div className="zr-query-filter--elements">
			<FilterElements handlers={handlersForChild} filter={filter} useOR={useOR} />
			<Button className="zr-text-small" intent="primary" minimal={true} onClick={addTerm} rightIcon="small-plus" small={true} text={useOR ? "OR" : "AND"} />
		</div>
		{!isOnlyChild && <Button className="zr-filter--remove-self" icon="small-cross" minimal={true} onClick={removeSelf} />}
	</>;
}
Filter.propTypes = {
	filter: array,
	handlers: shape({
		removeSelf: func,
		addTerm: func,
		removeTerm: func,
		updateTerm: func
	}),
	isOnlyChild: bool,
	useOR: bool
};

function QueryFilterList({ handlers, terms, useOR }){
	const { addTerm, removeTerm, updateTerm } = handlers;

	const makeHandlersForChild = useCallback((index) => {
		let child = terms[index];
		return {
			removeSelf: () => removeTerm(index),
			addTerm: () => updateTerm(index, returnSiblingArray(child, [defaultQueryTerm])),
			removeTerm: (subindex) => updateTerm(index, removeArrayElemAt(child, subindex)),
			updateTerm: (subindex, value) => updateTerm(index, updateArrayElemAt(child, subindex, value))
		};
	}, [removeTerm, terms, updateTerm]);

	return <div className="zr-query-filters">
		{terms.map((term, index) => {
			let elemHandlers = makeHandlersForChild(index);
			return <div className="zr-query-filter" key={index}>
				{index > 0 && <span zr-role="filter-list-operator">{useOR ? "OR" : "AND"}</span>}
				<Filter handlers={elemHandlers} isOnlyChild={terms.length == 1} filter={term} useOR={!useOR} />
			</div>;
		})}
		<Button className="zr-text-small" minimal={true} onClick={addTerm} rightIcon="small-plus" small={true} text={terms.length == 0 ? "Set filter" : (useOR ? "OR" : "AND")} />
	</div>;
}
QueryFilterList.propTypes = {
	handlers: shape({
		addTerm: func,
		removeTerm: func,
		updateTerm: func
	}),
	terms: array,
	useOR: bool
};

export default QueryFilterList;
