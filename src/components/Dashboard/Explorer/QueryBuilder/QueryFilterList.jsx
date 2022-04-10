import React, { useCallback, useState } from "react";
import { array, bool, func, object, oneOfType, shape } from "prop-types";
import { Button, Classes, Dialog, Tag } from "@blueprintjs/core";

import { defaultQueryTerm } from "./queries";
import { addElemToArray, removeArrayElemAt, returnSiblingArray, updateArrayElemAt } from "./utils";
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

	const addNestedTerm = useCallback(() => updateSelf(addElemToArray(term, [defaultQueryTerm])), [term, updateSelf]);

	return <>
		<Tag className="zr-query-term--tag" interactive={true} minimal={true} onClick={openDialog} onRemove={removeSelf} >
			{cleanOuterParentheses(makeTermString(term, !useOR))}
		</Tag>
		{!isLast && <span className="zr-query-term--operator">{useOR ? "or" : "and"}</span>}
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
	const { removeSelf, addTerm, ...toPassDown } = handlers;

	return <div className="zr-query-term">
		<FilterElements handlers={toPassDown} filter={filter} useOR={useOR} />
		<Button intent="primary" minimal={true} onClick={addTerm} rightIcon="small-plus" text="Add term" />
		<Button icon="small-cross" minimal={true} onClick={removeSelf} />
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

	return terms.map((term, index) => {
		let elemHandlers = makeHandlersForChild(index);
		return <div className="zr-query-box" key={index}>
			{index > 0 && <Tag>{useOR ? "or" : "and"}</Tag>}
			<Filter handlers={elemHandlers} filter={term} useOR={!useOR} />
			{index == terms.length - 1 
				? <Button active={true} icon="small-plus" intent="primary" minimal={true} onClick={addTerm} text="New filter" />
				: null}
			<Button className="zr-query-box--remove-self" icon="cross" minimal={true} onClick={() => removeTerm(index)} />
		</div>;
	});
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
