import React, { useCallback} from "react";
import { array, bool, func, shape } from "prop-types";
import { Button } from "@blueprintjs/core";

import QueryEntry from "./QueryEntry";
import { defaultQueryTerm } from "./queries";
import { removeArrayElemAt, returnSiblingArray, updateArrayElemAt } from "./utils";

function QueryBox({ handlers, terms = [], useOR = true }){
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
			removeSelf: terms.length == 1 ? false : () => removeTerm(index),
			updateSelf: (value) => updateTerm(index, value)
		};
	}, [removeTerm, updateTerm, terms.length]);

	return <div className="zr-query-box">
		<Button className="zr-query-box--remove-self" icon="cross" minimal={true} onClick={removeSelf} />
		{terms.map((tm, index) => {
			let elemHandlers = makeHandlersForChild(index);
			if(tm.constructor === Array){
				return <QueryBox key={index} handlers={elemHandlers} terms={tm} useOR={!useOR} />;
			} else {
				return <QueryEntry key={index} handlers={elemHandlers} term={tm} useOR={!useOR} />;
			}
		})}
		<Button className={["zr-query-box--add-sibling", "zr-text-small"].join(" ")} icon="small-plus" minimal={true} onClick={addTerm} small={true} text={(useOR ? "OR" : "AND")} />
	</div>;
}
QueryBox.propTypes = {
	handlers: shape({
		removeSelf: func,
		updateSelf: func
	}),
	terms: array,
	useOR: bool
};

export default QueryBox;
