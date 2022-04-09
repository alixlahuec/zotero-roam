import React, { useCallback, useEffect, useMemo, useState } from "react";
import { array } from "prop-types";
import { NonIdealState, Switch } from "@blueprintjs/core";

import { ListItem, ListWrapper, Pagination, Toolbar } from "../../../DataList";
import QueryBox from "./QueryBox";
import { defaultQueryTerm, runQuerySet } from "./queries";
import { addElemToArray, updateArrayElemAt, removeArrayElemAt } from "./utils";

import "./index.css";

const itemsPerPage = 20;

function QueryBuilder({ items }){
	const [currentPage, setCurrentPage] = useState(1);
	const [useOR, setUseOR] = useState(true);
	const [queryTerms, setQueryTerms] = useState([defaultQueryTerm]);

	const switchOperator = useCallback(() => setUseOR(prev => !prev), []);

	const addQueryTerm = useCallback(() => {
		setQueryTerms(prev => addElemToArray(prev, defaultQueryTerm));
	}, []);

	const removeQueryTerm = useCallback((index) => {
		setQueryTerms(prev => removeArrayElemAt(prev, index));
	}, []);

	const handleQueryTermChange = useCallback((index, value) => {
		setQueryTerms(prev => updateArrayElemAt(prev, index, value));
	}, []);

	const handlers = useMemo(() => {
		return {
			removeSelf: false,
			addTerm: addQueryTerm,
			removeTerm: removeQueryTerm,
			updateTerm: handleQueryTermChange
		};
	}, [addQueryTerm, removeQueryTerm, handleQueryTermChange]);

	const queriedItems = useMemo(() => items.filter(it => runQuerySet(queryTerms, useOR, it)), [items, queryTerms, useOR]);

	const pageLimits = useMemo(() => [itemsPerPage*(currentPage - 1), itemsPerPage*currentPage], [currentPage]);

	useEffect(() => {
		setCurrentPage(1);
	}, [items, queriedItems]);

	return <div className="zr-query-builder">
		<Toolbar>
			<Switch checked={useOR} innerLabel="AND" innerLabelChecked="OR" onChange={switchOperator} />
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
