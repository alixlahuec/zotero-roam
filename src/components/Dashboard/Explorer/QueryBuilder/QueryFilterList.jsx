import React, { useCallback, useMemo, useState } from "react";
import { array, bool, func, object, oneOfType, shape } from "prop-types";
import { Button, Classes, Dialog, Tag } from "@blueprintjs/core";

import { defaultQueryTerm } from "./queries";
import { removeArrayElemAt, returnSiblingArray, updateArrayElemAt } from "./utils";
import { cleanOuterParentheses } from "../../../../utils";

function joinTerm(term){
	const {property, relationship, value} = term;
	return [property, relationship, value].filter(Boolean).join(" ");
}

function makeTermString(term, useOR){
	if(term.constructor === Object){
		return joinTerm(term);
	} else {
		let output = term
			.map(tm => makeTermString(tm, !useOR))
			.join(useOR ? " or " : " and ");
		return `(${output})`;
	}
}

function TermTag({ handlers, isLast, term, useOR }){
	const { removeSelf, updateSelf } = handlers;
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const openDialog = useCallback(() => setIsDialogOpen(true), []);
	const closeDialog = useCallback(() => setIsDialogOpen(false), []);

	const addNestedTerm = useCallback(() => updateSelf(returnSiblingArray(term, [defaultQueryTerm])), [term, updateSelf]);

	return <>
		<Tag zr-role="filter-tag" interactive={true} large={true} minimal={true} onClick={openDialog} onRemove={removeSelf} >
			{cleanOuterParentheses(makeTermString(term, !useOR))}
		</Tag>
		{!isLast && <span zr-role="filter-operator">{useOR ? "or" : "and"}</span>}
		<Dialog canEscapeKeyClose={false} isOpen={isDialogOpen} lazy={true} onClose={closeDialog} >
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_BODY}>
					{JSON.stringify(term)}
					<Button onClick={addNestedTerm} rightIcon="small-plus" text="Add term" />
				</div>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button minimal={true} onClick={removeSelf} text="Remove term" />
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
	term: oneOfType([array, object]),
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
		return <TermTag key={index} handlers={elemHandlers} isLast={index == filter.length - 1} term={term} useOR={!useOR} />;
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

function Filter({ filter, handlers, useOR }){
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

	return <div className="zr-query-filter--elements">
		<FilterElements handlers={handlersForChild} filter={filter} useOR={useOR} />
		<Button className="zr-text-small" intent="primary" minimal={true} onClick={addTerm} rightIcon="small-plus" small={true} text={useOR ? "OR" : "AND"} />
		{filter.length > 1 && <Button className="zr-filter--remove-self" icon="small-cross" minimal={true} onClick={removeSelf} />}
	</div>;
}
Filter.propTypes = {
	handlers: shape({
		removeSelf: func,
		addTerm: func,
		removeTerm: func,
		updateTerm: func
	}),
	filter: array,
	useOR: bool
};

function QueryFilterList({ handlers, terms, useOR }){
	const { addTerm, removeTerm, updateTerm } = handlers;

	const makeHandlersForChild = useCallback((index) => {
		let child = terms[index];
		return {
			removeSelf: () => removeTerm(index),
			addTerm: () => updateTerm(index, returnSiblingArray(child, defaultQueryTerm)),
			removeTerm: (subindex) => updateTerm(index, removeArrayElemAt(child, subindex)),
			updateTerm: (subindex, value) => updateTerm(index, updateArrayElemAt(child, subindex, value))
		};
	}, [removeTerm, terms, updateTerm]);

	return <div className="zr-query-filters">
		{terms.map((term, index) => {
			let elemHandlers = makeHandlersForChild(index);
			return <div className="zr-query-filter" key={index}>
				{index > 0 && <span zr-role="filter-list-operator">{useOR ? "or" : "and"}</span>}
				<Filter handlers={elemHandlers} filter={term} useOR={!useOR} />
			</div>;
		})}
		<Button active={true} className="zr-text-small" icon="small-plus" onClick={addTerm} small={true} text={terms.length == 0 ? "Set filter" : (useOR ? "OR" : "AND")} />
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
