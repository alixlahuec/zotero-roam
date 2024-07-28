import { Dispatch, Fragment, useCallback } from "react";
import { Button } from "@blueprintjs/core";

import QueryEntry from "../QueryEntry/QueryEntry";

import { returnSiblingArray } from "../utils";
import { defaultQueryTerm } from "../queries";
import { removeArrayElemAt, updateArrayElemAt } from "../../../../../utils";

import { CustomClasses } from "../../../../../constants";
import { QueryTerm, QueryTermListRecursive, QueryBoxAction, QueryTermAction } from "../types";

import "./_index.sass";


type OwnProps = {
	dispatch: Dispatch<QueryBoxAction>,
	isFirstChild: boolean,
	isOnlyChild: boolean,
	terms?: (QueryTerm | QueryTermListRecursive)[],
	useOR?: boolean
};

function QueryBox({ dispatch, isFirstChild, isOnlyChild, terms = [], useOR = true }: OwnProps) {
	const removeSelf = useCallback(() => dispatch({ type: "removeSelf" }), [dispatch]);
	const addTerm = useCallback(() => dispatch({ type: "updateSelf", value: returnSiblingArray(terms, defaultQueryTerm) }), [dispatch, terms]);

	const termDispatch = useCallback(<T extends QueryTerm | QueryTermListRecursive>(index, action: QueryTermAction<T>) => {
		switch (action.type) {
		case "removeSelf":
			return dispatch({ type: "updateSelf", value: removeArrayElemAt(terms, index) });
		case "updateSelf":
			return dispatch({ type: "updateSelf", value: updateArrayElemAt(terms, index, action.value) });
		default:
			return;
		}
	}, [dispatch, terms]);

	return <>
		<div className="zr-query-box">
			{!isFirstChild && <span zr-role="query-entry-operator">{useOR ? "OR" : "AND"}</span>}
			<div>
				{terms.map((tm, index) => {
					const termProps = {
						dispatch: (action) => termDispatch(index, action),
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
