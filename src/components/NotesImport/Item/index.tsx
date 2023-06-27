import { useCallback, useMemo } from "react";
import { Classes, Checkbox, Tag } from "@blueprintjs/core";

import { ListItem } from "Components/DataList";

import { formatItemNotes, simplifyZoteroAnnotations } from "../../../utils";

import { CustomClasses } from "../../../constants";
import { ZItemAnnotation, ZItemNote, isZNote } from "Types/transforms";
import "./_index.sass";


function Annotation({ annotation }: { annotation: ZItemAnnotation}){
	const { color, comment, text, type } = useMemo(() => simplifyZoteroAnnotations([annotation])[0], [annotation]);
	
	// https://shannonpayne.com.au/how-to-create-a-low-highlight-text-effect-using-css/
	const highlightStyle = useMemo(() => ({
		"backgroundImage": `linear-gradient(120deg, ${color}50 0%, ${color}50 100%)`
	}), [color]);

	return <div className={CustomClasses.TEXT_SMALL} zr-role="note-contents">
		{text && <span title={text} className={[CustomClasses.TEXT_AUXILIARY, Classes.TEXT_OVERFLOW_ELLIPSIS].join(" ")} style={highlightStyle}>{text}</span>}
		{type == "image" && <code className={Classes.CODE}>Images are currently not supported</code>}
		{comment && <div title={comment} className={[CustomClasses.TEXT_SECONDARY, Classes.TEXT_OVERFLOW_ELLIPSIS].join(" ")}>{comment}</div>}
	</div>;
}


function Note({ note }: { note: ZItemNote }){
	const notesContent = useMemo(() => formatItemNotes([note]).join(" "), [note]);
	
	return <div className={[CustomClasses.TEXT_SMALL, CustomClasses.TEXT_AUXILIARY].join(" ")} zr-role="note-contents">
		<p title={notesContent}>{notesContent}</p>
	</div>;
}


type NotesImportItemProps = {
	note: ZItemAnnotation | ZItemNote,
	isSelected: boolean,
	isSingleChild: boolean,
	onToggle: (value: string) => void
};

function NotesImportItem({ note, isSelected, isSingleChild, onToggle }: NotesImportItemProps) {
	const handleToggle = useCallback(() => onToggle(note.data.key), [note.data.key, onToggle]);

	const itemContents = useMemo(() => {
		if(isZNote(note)){
			return <Note note={note} />;
		} else {
			return <Annotation annotation={note} />;
		}
	}, [note]);

	return <ListItem className="zr-notesimport-item" aria-label={note.data.key} onClick={handleToggle} >
		<div className="zr-notesimport-item--header" >
			{isSingleChild
				? itemContents
				: <Checkbox
					checked={isSelected}
					className="zr-notesimport-item--title"
					inline={false}
					labelElement={itemContents}
					onChange={handleToggle}
				/>
			}
		</div>
		<div className={["zr-notesimport-item--contents", CustomClasses.TEXT_SMALL].join(" ")} >
			<div>{note.data.tags.map((t, i) => <Tag key={i} minimal={true} >{t.tag}</Tag>)}</div>
		</div>
	</ListItem>;
}


export default NotesImportItem;