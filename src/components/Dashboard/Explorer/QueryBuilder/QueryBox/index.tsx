import { Fragment, useCallback } from "react";
import { Button } from "@blueprintjs/core";

import QueryEntry from "../QueryEntry/QueryEntry";

import { removeArrayElemAt, returnSiblingArray, updateArrayElemAt } from "../utils";
import { defaultQueryTerm } from "../queries";

import { CustomClasses } from "../../../../../constants";
import { QueryTerm, QueryTermListRecursive } from "../types";


type OwnProps = {
	handlers: {
		removeSelf: () => void,
		updateSelf: (value: (QueryTerm | QueryTermListRecursive)[]) => void
	},
	isFirstChild: boolean,
	isOnlyChild: boolean,
	terms?: (QueryTerm | QueryTermListRecursive)[],
	useOR?: boolean
};

function QueryBox({ handlers, isFirstChild, isOnlyChild, terms = [], useOR = true }: OwnProps){
	const { removeSelf, updateSelf } = handlers;

	const addTerm = useCallback(() => {
		updateSelf(returnSiblingArray(terms, defaultQueryTerm));
	}, [terms, updateSelf]);

	const removeTerm = useCallback((index: number) => {
		updateSelf(removeArrayElemAt(terms, index));
	}, [terms, updateSelf]);

	const updateTerm = useCallback((index: number, value: QueryTerm | QueryTermListRecursive) => {
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
			{!isFirstChild && <span zr-role="query-entry-operator">{useOR ? "OR" : "AND"}</span>}
			<div>
				{terms.map((tm, index) => {
					const termProps = {
						handlers: makeHandlersForChild(index),
						isFirstChild: index == 0,
						isOnlyChild: terms.length == 1,
						useOR: !useOR
					};

					return (
						<Fragment key={index}>
							{Array.isArray(tm)
								? <QueryBox terms={tm} {...termProps} />
								: <QueryEntry term={tm} {...termProps} />}
						</Fragment>
					);

				})}
			</div>
			{!isOnlyChild && <Button className="zr-query-box--remove-self" icon="cross" minimal={true} onClick={removeSelf} title="Remove query group" />}
		</div>
		<Button className={["zr-query-box--add-sibling", CustomClasses.TEXT_SMALL].join(" ")} minimal={true} onClick={addTerm} rightIcon="small-plus" small={true} text={(useOR ? "OR" : "AND")} />
	</>;
}


export default QueryBox;
