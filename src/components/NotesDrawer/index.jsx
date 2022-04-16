import React, { useContext, useMemo } from "react";
import { arrayOf, bool, func, object } from "prop-types";
import { Button, Classes, Drawer, Tabs, Tab, Tag, ButtonGroup, Icon } from "@blueprintjs/core";

import { UserSettings } from "../App";
import ButtonLink from "../ButtonLink";
import { compareAnnotationIndices, formatZoteroNotes, makeDateFromAgo, simplifyZoteroAnnotations, simplifyZoteroNotes } from "../../utils";

import * as customPropTypes from "../../propTypes";

import "./index.css";

function Annotation({ annot }){
	let { color, comment, dateModified, link_page, link_pdf, pageLabel, tags, text, type } = annot;

	// https://shannonpayne.com.au/how-to-create-a-low-highlight-text-effect-using-css/
	let highlightStyle = useMemo(() => ({
		"backgroundImage": `linear-gradient(120deg, ${color}50 0%, ${color}50 100%)`
	}), [color]);

	return <div className={["zr-drawer--notes-card", "zr-text-small"].join(" ")}>
		<div zr-role="card-header">
			<span>{tags.map((tag, j) => <Tag key={j} minimal={true} >{tag}</Tag>)}</span>
			<ButtonGroup minimal={true}>
				<ButtonLink className="zr-text-small" href={link_pdf} icon="paperclip" >PDF</ButtonLink>
				<ButtonLink className="zr-text-small" href={link_page} >Page {pageLabel}</ButtonLink>
			</ButtonGroup>
		</div>
		<div className="zr-annotation--highlight">
			{text && <span style={highlightStyle}>{text}</span>}
			{type == "image" && <code className={Classes.CODE}>Images are currently not supported</code>}
		</div>
		{comment && <div className="zr-annotation--comment"><Icon icon="nest" intent="primary" size={14} />{comment}</div>}
		<div zr-role="card-footer">
			<span className="zr-secondary">{makeDateFromAgo(dateModified)}</span>
		</div>
	</div>;
}
Annotation.propTypes = {
	annot: customPropTypes.cleanAnnotationItemType
};

function Note({ note }){
	let { dateModified, link_note, raw, tags } = note;
	const { notes: notesSettings } = useContext(UserSettings);

	const notesList = useMemo(() => formatZoteroNotes([raw], notesSettings), [notesSettings, raw]);

	return notesList.map((nt, i) => {
		return <div key={i} className={["zr-drawer--notes-card", "zr-text-small"].join(" ")}>
			<div zr-role="card-header">
				<span>{tags.map((tag, j) => <Tag key={j} minimal={true} >{tag}</Tag>)}</span>
				<ButtonGroup minimal={true}>
					<ButtonLink className="zr-text-small" href={link_note} icon="comment">View in Zotero</ButtonLink>
				</ButtonGroup>
			</div>
			<div className="zr-note--contents">
				{nt}
			</div>
			<div zr-role="card-footer">
				<span className="zr-secondary">{makeDateFromAgo(dateModified)}</span>
			</div>
		</div>;
	});
}
Note.propTypes = {
	note: customPropTypes.cleanNoteItemType
};

function PanelAnnotations({ annots }){
	let clean_annotations = simplifyZoteroAnnotations(annots)
		.sort((a,b) => compareAnnotationIndices(a.sortIndex, b.sortIndex));

	return clean_annotations.map(annot => <Annotation key={annot.key} annot={annot} /> );
}
PanelAnnotations.propTypes = {
	annots: arrayOf(object)
};

function PanelNotes({ notes }){
	let clean_notes = simplifyZoteroNotes(notes);

	return clean_notes.map(nt => <Note key={nt.key} note={nt} />);
}
PanelNotes.propTypes = {
	notes: arrayOf(customPropTypes.zoteroItemType)
};

const NotesDrawer = React.memo(function NotesDrawer(props){
	const { isOpen, notes, onClose } = props;

	const annots = useMemo(() => notes.filter(n => n.data.itemType == "annotation"), [notes]);
	const noteItems = useMemo(() => notes.filter(n => n.data.itemType == "note"), [notes]);

	return (
		<Drawer
			canEscapeKeyClose={false}
			canOutsideClickClose={true}
			className="zr-drawer--notes"
			isOpen={isOpen}
			lazy={false}
			onClose={onClose}
			size="40%" >
			<Tabs animate={false} className="zr-tabs-minimal" id="zr-drawer--notes" >
				{annots.length > 0 && <Tab id="annotations" panel={<PanelAnnotations annots={annots} />} title="Annotations" />}
				{noteItems.length > 0 && <Tab id="notes" panel={<PanelNotes notes={noteItems} />} title="Notes" />}
				<Tabs.Expander />
				<Button icon="cross" minimal={true} onClick={onClose} />
			</Tabs>
		</Drawer>
	);
});
NotesDrawer.propTypes = {
	isOpen: bool,
	notes: arrayOf(object),
	onClose: func
};

export default NotesDrawer;
