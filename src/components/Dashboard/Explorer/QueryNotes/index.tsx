import { useEffect, useState } from "react";
import { Spinner } from "@blueprintjs/core";

import { ListItem, ListWrapper } from "Components/DataList";

import { ZItemAnnotation, ZItemNote, ZLibraryContents } from "Types/transforms";


type QueryNotesListProps = {
	items: (ZItemAnnotation | ZItemNote)[]
};

function QueryNotesList({ items }: QueryNotesListProps) {
	return <ListWrapper>
		{items.slice(0, 20).map((it, i) => (
			<ListItem key={it.key + "-" + i}>
				{it.key}
			</ListItem>
		))}
	</ListWrapper>;
}


type QueryNotesProps = {
	itemList: ZLibraryContents
};

function QueryNotes({ itemList }: QueryNotesProps) {
	const [items, setItems] = useState<(ZItemAnnotation | ZItemNote)[] | null>(null);

	useEffect(() => {
		if (itemList) {
			setItems(itemList.notes);
		}
	}, [itemList]);

	return items == null
		? <Spinner size={15} />
		: <QueryNotesList items={items} />;
}

export default QueryNotes;