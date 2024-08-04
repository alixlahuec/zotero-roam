import { useEffect, useState } from "react";
import { Spinner } from "@blueprintjs/core";

import { ListItem } from "Components/DataList";
import QueryBar from "../QueryBar";

import { noteFilters } from "./filters";

import { ZItemAnnotation, ZItemNote, ZLibraryContents } from "Types/transforms";


const renderItem = (item: ZItemAnnotation | ZItemNote) => {
	return <ListItem key={[item.library.id, item.key].join(" ")}>{item.key}</ListItem>
};


type QueryNotesProps = {
	itemList: ZLibraryContents
};

function QueryNotes({ itemList }: QueryNotesProps) {
	const [items, setItems] = useState<(ZItemAnnotation | ZItemNote)[] | null>(null);
	const [query, setQuery] = useState("");

	useEffect(() => {
		if (itemList) {
			setItems(itemList.notes);
		}
	}, [itemList]);

	return items == null
		? <Spinner size={15} />
		: <QueryBar filters={noteFilters} items={items} onQueryChange={setQuery} query={query} renderItem={renderItem} />;
}

export default QueryNotes;