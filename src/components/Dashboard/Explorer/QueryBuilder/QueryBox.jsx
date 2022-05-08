import React, { useCallback} from "react";
import { array, bool, func, shape } from "prop-types";
import { Button } from "@blueprintjs/core";

import QueryEntry from "./QueryEntry";
import { defaultQueryTerm } from "./queries";
import { removeArrayElemAt, returnSiblingArray, updateArrayElemAt } from "./utils";

function QueryBox({ handlers, isLastChild, isOnlyChild, terms = [], useOR = true }){
	const { removeSelf, updateSelf } = handlers;

	const addTerm = useCallback(() => {
		updateSelf(returnSiblingArray(terms, defaultQueryTerm));
	}, [terms, updateSelf]);

	const removeTerm = useCallback((index) => {
		updateSelf(removeArrayElemAt(terms, index));
	}, [terms, updateSelf]);

	const updateTerm = useCallback((index, value) => {
		updateSelf(updateArrayElemAt(terms, index, value));
	}, [terms, updateSelf]);

	const makeHandlersForChild = useCallback((index) => {
		return {
			removeSelf: () => removeTerm(index),
			updateSelf: (value) => updateTerm(index, value)
		};
	}, [removeTerm, updateTerm]);

	return <>
		<div className="zr-query-box">
			{!isOnlyChild && <Button className="zr-query-box--remove-self" icon="cross" minimal={true} onClick={removeSelf} />}
			{terms.map((tm, index) => {
				let elemHandlers = makeHandlersForChild(index);
				if(tm.constructor === Array){
					return <QueryBox key={index} handlers={elemHandlers} isLastChild={index == terms.length - 1} isOnlyChild={terms.length == 1} terms={tm} useOR={!useOR} />;
				} else {
					return <QueryEntry key={index} handlers={elemHandlers} isLastChild={index == terms.length - 1} isOnlyChild={terms.length == 1} term={tm} useOR={!useOR} />;
				}
			})}
		</div>
		{isLastChild
			? <Button className={["zr-query-box--add-sibling", "zr-text-small"].join(" ")} icon="small-plus" minimal={true} onClick={addTerm} small={true} text={(useOR ? "OR" : "AND")} />
			: <span zr-role="query-box-operator">{useOR ? "OR" : "AND"}</span>}
	</>;
}
QueryBox.propTypes = {
	handlers: shape({
		removeSelf: func,
		updateSelf: func
	}),
	isLastChild: bool,
	isOnlyChild: bool,
	terms: array,
	useOR: bool
};

export default QueryBox;
