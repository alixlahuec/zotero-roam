import React, { useCallback} from "react";
import { array, arrayOf, bool, func, object, oneOfType, shape } from "prop-types";
import { Button, Tag } from "@blueprintjs/core";

import QueryEntry from "./QueryEntry";
import { defaultQueryTerm } from "./queries";
import { removeArrayElemAt, returnSiblingArray, updateArrayElemAt } from "./utils";

function QueryBox({ handlers, terms = [], useOR = true }){
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

	const makeHandlersForEntry = useCallback((index) => {
		return {
			removeSelf: terms.length == 1 ? false : () => removeTerm(index),
			addSiblingTerm: () => addChildTerm(index),
			updateSelf: (value) => updateTerm(index, value)
		};
	}, [addChildTerm, removeTerm, updateTerm, terms.length]);

	return <div className="zr-query-box">
		{removeSelf ? <Button icon="cross" minimal={true} onClick={removeSelf} />
			: null}
		{terms.map((tm, index) => {
			if(tm.constructor === Array){
				let elemHandlers = makeHandlersForChild(index);
				return <QueryBox key={index} handlers={elemHandlers} terms={tm} useOR={!useOR} />;
			} else {
				let elemHandlers = makeHandlersForEntry(index);
				return <>
					{index > 0 && <Tag minimal={true}>{useOR ? "OR" : "AND"}</Tag>}
					<QueryEntry key={index} handlers={elemHandlers} term={tm} useOR={!useOR} />
				</>;
			}
		})}
		<Button icon="small-plus" minimal={true} onClick={addTerm} text={(useOR ? "OR" : "AND")} />
	</div>;
}
QueryBox.propTypes = {
	handlers: shape({
		removeSelf: oneOfType([func, bool]),
		addTerm: func,
		removeTerm: func,
		updateTerm: func
	}),
	terms: arrayOf(oneOfType([object, array])),
	useOR: bool
};

export default QueryBox;
