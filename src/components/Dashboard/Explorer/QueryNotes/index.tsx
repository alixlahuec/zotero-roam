import { useEffect, useMemo, useState } from "react";
import { Classes, Spinner, Tag } from "@blueprintjs/core";

import { ListItem } from "Components/DataList";
import QueryBar from "../QueryBar";

import { noteFilters } from "./filters";

import { CustomClasses } from "../../../../constants";
import { formatItemNotes, simplifyZoteroAnnotations } from "../../../../utils";
import { isZNote, ZItemAnnotation, ZItemNote, ZLibraryContents } from "Types/transforms";


function Annotation({ annotation }: { annotation: ZItemAnnotation }) {
	const { color, comment, text, type } = useMemo(() => simplifyZoteroAnnotations([annotation])[0], [annotation]);

	// https://shannonpayne.com.au/how-to-create-a-low-highlight-text-effect-using-css/
	const highlightStyle = useMemo(() => ({
		"backgroundImage": `linear-gradient(120deg, ${color}50 0%, ${color}50 100%)`
	}), [color]);

	return <div className={CustomClasses.TEXT_SMALL}>
		{text && <p><span title={text} className={[CustomClasses.TEXT_AUXILIARY, Classes.TEXT_OVERFLOW_ELLIPSIS].join(" ")} style={highlightStyle}>{text}</span></p>}
		{type == "image" && <p><code className={Classes.CODE}>Images are currently not supported</code></p>}
		{comment && <p title={comment} className={[CustomClasses.TEXT_SECONDARY, Classes.TEXT_OVERFLOW_ELLIPSIS].join(" ")}>{comment}</p>}
	</div>;
}


function Note({ note }: { note: ZItemNote }) {
	const notesContent = useMemo(() => formatItemNotes([note]).join(" "), [note]);

	return <div className={[CustomClasses.TEXT_SMALL, CustomClasses.TEXT_AUXILIARY].join(" ")}>
		<p title={notesContent}>{notesContent}</p>
	</div>;
}


const renderItem = (item: ZItemAnnotation | ZItemNote) => {
	const itemContents = useMemo(() => {
		if (isZNote(item)) {
			return <Note note={item} />;
		}
		return <Annotation annotation={item} />;
	}, []);

	return <ListItem className="zr-query--result" key={[item.library.id, item.key].join(" ")}>
		<div>
			{itemContents}
		</div>
		<div className={[CustomClasses.TEXT_SMALL].join(" ")} >
			<div>{item.data.tags.map((t, i) => <Tag key={i} minimal={true} >{t.tag}</Tag>)}</div>
		</div>
	</ListItem>;
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