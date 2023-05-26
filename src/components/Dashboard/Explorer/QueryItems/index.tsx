import { useCallback, useEffect, useMemo, useState } from "react";
import { NonIdealState, Spinner } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "Components/DataList";
import { useRoamCitekeys } from "Components/RoamCitekeysContext";
import ItemElement from "./ItemElement";
import QueryFilterList from "../QueryBuilder/QueryFilterList";

import { usePagination } from "../../../../hooks";
import { addElemToArray, removeArrayElemAt, updateArrayElemAt } from "../QueryBuilder/utils";
import { runQuerySet } from "../QueryBuilder/queries";
import { cleanLibraryItem, identifyChildren } from "../../../../utils";

import { CustomClasses } from "../../../../constants";
import { QueryTermListRecursive } from "../QueryBuilder/types";
import { RCitekeyPages, ZCleanItemTop, ZLibraryContents } from "Types/transforms";
import "./index.css";


function cleanLibraryData(itemList: ZLibraryContents, roamCitekeys: RCitekeyPages): Promise<ZCleanItemTop[]>{
	return new Promise((resolve) => {
		setTimeout(() => {
			const data = itemList.items
				.map(item => {
					const itemKey = item.data.key;
					const location = item.library.type + "s/" + item.library.id;
					const { pdfs, notes } = identifyChildren(itemKey, location, { pdfs: itemList.pdfs, notes: itemList.notes });

					return cleanLibraryItem(item, pdfs, notes, roamCitekeys);
				});
			resolve(data);
		}, 0);
	});
}


const itemsPerPage = 20;

type QueryItemsListProps = {
	items: ZCleanItemTop[],
	onClose: () => void
};

function QueryItemsList({ items, onClose }: QueryItemsListProps){
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });
	const [useOR, /*setUseOR*/] = useState(true);
	const [queryTerms, setQueryTerms] = useState<QueryTermListRecursive[][]>([]);

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


type QueryItemsProps = {
	itemList: ZLibraryContents,
	onClose: () => void
};

function QueryItems({ itemList, onClose }: QueryItemsProps) {
	const [roamCitekeys,] = useRoamCitekeys();
	const [items, setItems] = useState<ZCleanItemTop[] | null>(null);

	useEffect(() => {
		if(itemList){
			cleanLibraryData(itemList, roamCitekeys)
				.then(data => {
					setItems(data);
				});
		}
	}, [itemList, roamCitekeys]);

	return items == null
		? <Spinner size={15} />
		: <QueryItemsList items={items} onClose={onClose} />;
}


export default QueryItems;
