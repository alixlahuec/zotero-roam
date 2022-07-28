import React, { useCallback, useEffect, useMemo, useState } from "react";
import { func } from "prop-types";
import { NonIdealState } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "../../../DataList";
import ItemElement from "./ItemElement";
import QueryFilterList from "./QueryFilterList";

import { runQuerySet } from "./queries";
import { addElemToArray, updateArrayElemAt, removeArrayElemAt } from "./utils";

import usePagination from "../../../../hooks/usePagination";

import { CustomClasses } from "../../../../constants";
import * as customPropTypes from "../../../../propTypes";
import "./index.css";

const itemsPerPage = 20;

function QueryBuilder({ items, onClose }){
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });
	const [useOR, /*setUseOR*/] = useState(true);
	const [queryTerms, setQueryTerms] = useState([]);

	const addQueryTerm = useCallback((val) => setQueryTerms(prev => addElemToArray(prev, [val])), []);
	const removeQueryTerm = useCallback((index) => setQueryTerms(prev => removeArrayElemAt(prev, index)), []);
	const handleQueryTermChange = useCallback((index, value) => setQueryTerms(prev => updateArrayElemAt(prev, index, value)), []);

	const handlers = useMemo(() => ({
		addTerm: addQueryTerm,
		removeTerm: removeQueryTerm,
		updateTerm: handleQueryTermChange
	}), [addQueryTerm, removeQueryTerm, handleQueryTermChange]);

	const queriedItems = useMemo(() => items.filter(it => runQuerySet(queryTerms, useOR, it)), [items, queryTerms, useOR]);

	useEffect(() => {
		setCurrentPage(1);
	}, [items, queriedItems, setCurrentPage]);

	return <div className="zr-query-builder">
		<Toolbar>
			<QueryFilterList handlers={handlers} terms={queryTerms} useOR={useOR} />
		</Toolbar>
		<ListWrapper>
			{queriedItems.length > 0
				? queriedItems
					.slice(...pageLimits)
					.map(el => <ItemElement key={[el.location, el.key].join("-")} item={el} onClose={onClose} />)
				: <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No items to display" />}
		</ListWrapper>
		<Toolbar>
			<Pagination
				arrows="first" 
				currentPage={currentPage} 
				itemsPerPage={itemsPerPage} 
				nbItems={queriedItems.length} 
				setCurrentPage={setCurrentPage} 
			/>
		</Toolbar>
	</div>;
}
QueryBuilder.propTypes = {
	items: customPropTypes.cleanLibraryReturnArrayType,
	onClose: func
};

export default QueryBuilder;
