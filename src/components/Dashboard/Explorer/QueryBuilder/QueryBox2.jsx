import React, { useCallback, useMemo, useState } from "react";
import { any, array, bool, func, oneOfType, shape, string } from "prop-types";
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

function TermTag({ handlers, term, useOR }){
	const { removeSelf } = handlers;
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const termList = useMemo(() => term.constructor === Array ? term : [term], [term]);
	const openDialog = useCallback(() => setIsDialogOpen(true), []);
	const closeDialog = useCallback(() => setIsDialogOpen(false), []);

	return termList.map((t, j) => {
		return <span className="zr-query-term--tag" key={j}> 
			<Tag interactive={true} minimal={true} onClick={openDialog} onRemove={removeSelf}>
				{cleanOuterParentheses(makeTermString(t, !useOR))}
			</Tag>
			<Dialog isOpen={isDialogOpen} lazy={true} onClose={closeDialog} >
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_BODY}>

					</div>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button minimal={true} onClick={removeSelf} text="Remove term" />
						<Button intent="primary" minimal={true} text="OK" />
					</div>
				</div>
			</Dialog>
			{j != termList.length - 1 && <span className="zr-query-term--operator">{useOR ? "or" : "and"}</span>}
		</span>;
	});
}
TermTag.propTypes = {
	handlers: shape({
		removeSelf: oneOfType([func, bool]),
		addTerm: func,
		removeTerm: func,
		updateTerm: func
	}),
	term: shape({
		property: string,
		relationship: string,
		value: any
	}),
	useOR: bool
};

function QueryTerm({ handlers, term, useOR }){
	const { addTerm } = handlers;
	return <div className="zr-query-term">
		<TermTag handlers={handlers} term={term} useOR={useOR} />
		<Button intent="primary" minimal={true} onClick={addTerm} rightIcon="small-plus" text="Add term" />
	</div>;
}
QueryTerm.propTypes = {
	handlers: shape({
		removeSelf: oneOfType([func, bool]),
		addTerm: func,
		removeTerm: func,
		updateTerm: func
	}),
	term: shape({
		property: string,
		relationship: string,
		value: any
	}),
	useOR: bool
};

function QueryBox2({ handlers, terms, useOR }){
	const { removeSelf, addTerm, removeTerm, updateTerm } = handlers;

	const addChildTerm = useCallback((index) => {
		updateTerm(index, returnSiblingArray(terms[index], defaultQueryTerm));
	}, [terms, updateTerm]);

	const removeChildTerm = useCallback((index, subindex) => {
		let term = terms[index];
		updateTerm(index, removeArrayElemAt(term, subindex));
	}, [terms, updateTerm]);

	const updateChildTerm = useCallback((index, subindex, value) => {
		let term = terms[index];
		updateTerm(index, updateArrayElemAt(term, subindex, value));
	}, [terms, updateTerm]);

	const makeHandlersForChild = useCallback((index) => {
		return {
			removeSelf: terms.length == 1 ? false : () => removeTerm(index),
			addTerm: () => addChildTerm(index),
			removeTerm: (subindex) => removeChildTerm(index, subindex),
			updateTerm: (subindex, value) => updateChildTerm(index, subindex, value)
		};
	}, [removeTerm, addChildTerm, removeChildTerm, updateChildTerm, terms.length]);
	return terms.map((term, i) => {
		let elemHandlers = makeHandlersForChild(i);
		return <div className="zr-query-box" key={i}>
			{i !== 0 && <Tag>{useOR ? "or" : "and"}</Tag>}
			<QueryTerm handlers={elemHandlers} term={term} useOR={!useOR} />
			{i === terms.length - 1 && <Button active={true} icon="small-plus" intent="primary" minimal={true} onClick={addTerm} text="New filter" />}
			{removeSelf ? <Button className="zr-query-box--remove-self" icon="cross" minimal={true} onClick={removeSelf} />
				: null}
		</div>;
	});
}
QueryBox2.propTypes = {
	handlers: shape({
		removeSelf: oneOfType([func, bool]),
		addTerm: func,
		removeTerm: func,
		updateTerm: func
	}),
	terms: array,
	useOR: bool
};

export default QueryBox2;
