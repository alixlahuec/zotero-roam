import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@blueprintjs/core";

import { useRoamCitekeys } from "Components/RoamCitekeysContext";
import ItemElement from "./ItemElement";

import { useItemFilters } from "../filters";
import { cleanLibraryItem, identifyChildren } from "../../../../utils";

import { RCitekeyPages, ZCleanItemTop, ZLibraryContents } from "Types/transforms";
import QueryBar from "../QueryBar";


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


type QueryItemsProps = {
	itemList: ZLibraryContents,
	onClose: () => void
};

function QueryItems({ itemList, onClose }: QueryItemsProps) {
	const [roamCitekeys/*, updateCitekeys */] = useRoamCitekeys();
	const [items, setItems] = useState<ZCleanItemTop[] | null>(null);
	const { filters } = useItemFilters();
	const [query, setQuery] = useState("");

	const renderItem = useCallback((item: ZCleanItemTop) => {
		return <ItemElement key={[item.location, item.key].join("-")} item={item} onClose={onClose} />;
	}, [onClose]);

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
		: <QueryBar filters={filters} items={items} onQueryChange={setQuery} query={query} renderItem={renderItem} />;
}


export default QueryItems;
