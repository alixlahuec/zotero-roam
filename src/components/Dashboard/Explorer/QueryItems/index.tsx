import { useEffect, useMemo, useState } from "react";
import { NonIdealState, Spinner } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "Components/DataList";
import { useRoamCitekeys } from "Components/RoamCitekeysContext";

import { useArrayReducer, usePagination } from "@hooks";

import ItemElement from "./ItemElement";
import QueryFilterList from "../QueryBuilder/QueryFilterList";
import { runQuerySet } from "../QueryBuilder/queries";
import { cleanLibraryItem, identifyChildren } from "../../../../utils";

import { CustomClasses } from "../../../../constants";
import { QueryTermListRecursive } from "../QueryBuilder/types";
import { RCitekeyPages, ZCleanItemTop, ZLibraryContents } from "Types/transforms";


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
	const [useOR/*, setUseOR*/] = useState(true);
	const [queryTerms, dispatch] = useArrayReducer<QueryTermListRecursive[]>([]);

	const queriedItems = useMemo(() => items.filter(it => runQuerySet(queryTerms, useOR, it)), [items, queryTerms, useOR]);

	useEffect(() => {
		setCurrentPage(1);
	}, [items, queriedItems, setCurrentPage]);

	return <div className="zr-query-builder">
		<Toolbar>
			<QueryFilterList dispatch={dispatch} terms={queryTerms} useOR={useOR} />
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
	const [roamCitekeys/*, updateCitekeys */] = useRoamCitekeys();
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
