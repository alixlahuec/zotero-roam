import { func } from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NonIdealState } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "Components/DataList";
import ItemElement from "./ItemElement";
import QueryFilterList from "../QueryBuilder/QueryFilterList";

import { usePagination } from "../../../../hooks";

import { addElemToArray, removeArrayElemAt, updateArrayElemAt } from "../QueryBuilder/utils";
import { runQuerySet } from "../QueryBuilder/queries";

import * as customPropTypes from "../../../../propTypes";
import { CustomClasses } from "../../../../constants";

import "./index.css";


const itemsPerPage = 20;

function QueryItems({ items, onClose }){
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
		<div className="zr-queryitems--datalist">
			{queriedItems.length == 0
				? <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No items to display" />
				: <ListWrapper>
					{queriedItems
						.slice(...pageLimits)
						.map(el => <ItemElement key={[el.location, el.key].join("-")} item={el} onClose={onClose} />)}
				</ListWrapper>}
		</div>
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
QueryItems.propTypes = {
	items: customPropTypes.cleanLibraryReturnArrayType,
	onClose: func
};

export default QueryItems;
