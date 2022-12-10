import { bool, func } from "prop-types";
import { useCallback , useMemo } from "react";

import { Classes, Checkbox, Tag } from "@blueprintjs/core";

import { ListItem } from "Components/DataList";

import { formatItemNotes, simplifyZoteroAnnotations } from "../../../utils";

import { CustomClasses } from "../../../constants";
import * as customPropTypes from "../../../propTypes";
import "./index.css";


function Annotation({ annotation }){
	const { color, comment, text, type } = useMemo(() => simplifyZoteroAnnotations([annotation])[0], [annotation]);
	
	// https://shannonpayne.com.au/how-to-create-a-low-highlight-text-effect-using-css/
	const highlightStyle = useMemo(() => ({
		"backgroundImage": `linear-gradient(120deg, ${color}50 0%, ${color}50 100%)`
	}), [color]);

	return <div className={CustomClasses.TEXT_SMALL} zr-role="note-contents">
		{text && <span className={[CustomClasses.TEXT_AUXILIARY, Classes.TEXT_OVERFLOW_ELLIPSIS].join(" ")} style={highlightStyle}>{text}</span>}
		{type == "image" && <code className={Classes.CODE}>Images are currently not supported</code>}
		{comment && <div className={[CustomClasses.TEXT_SECONDARY, Classes.TEXT_OVERFLOW_ELLIPSIS].join(" ")}>{comment}</div>}
	</div>;
}
Annotation.propTypes = {
	annotation: customPropTypes.zoteroAnnotationType
};

function Note({ note }){
	const notesList = useMemo(() => formatItemNotes([note]), [note]);
	
	return <div className={[CustomClasses.TEXT_SMALL, CustomClasses.TEXT_AUXILIARY].join(" ")} zr-role="note-contents">
		<p>{notesList.join(" ")}</p>
	</div>;
}
Note.propTypes = {
	note: customPropTypes.zoteroItemType
};

function NotesImportItem({ note, isSelected, isSingleChild, onToggle }) {
	const handleToggle = useCallback(() => onToggle(note.data.key), [note.data.key, onToggle]);

	const itemContents = useMemo(() => {
		if(note.data.itemType == "note"){
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
			<span>{note.data.tags.map((t, i) => <Tag key={i} minimal={true} >{t.tag}</Tag>)}</span>
		</div>
	</ListItem>;
}
NotesImportItem.propTypes = {
	isSelected: bool,
	isSingleChild: bool,
	note: customPropTypes.zoteroItemType,
	onToggle: func
};

export default NotesImportItem;