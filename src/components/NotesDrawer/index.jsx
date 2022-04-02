import React, { useContext, useMemo } from "react";
import { arrayOf, bool, func, object, string } from "prop-types";
import { Button, Card, Classes, Drawer, Tabs, Tab, Tag, ButtonGroup } from "@blueprintjs/core";

import { UserSettings } from "../App";
import ButtonLink from "../ButtonLink";
import { compareAnnotationIndices, formatZoteroNotes, makeDateFromAgo, simplifyAnnotations } from "../../utils";

import * as customPropTypes from "../../propTypes";

import "./index.css";

function Annotation({ annot }){
	let { color, comment, pageLabel, text, dateModified, link_page, link_pdf, tags, type } = annot;

	// https://shannonpayne.com.au/how-to-create-a-low-highlight-text-effect-using-css/
	let highlightStyle = useMemo(() => ({
		"backgroundImage": `linear-gradient(120deg, ${color}50 0%, ${color}50 100%)`
	}), [color]);

	return <div className={["zr-drawer--notes-card", "zr-text-small"].join(" ")}>
		<div className="zr-annotation--header">
			<span>{tags.map((tag, j) => <Tag key={j} >{tag}</Tag>)}</span>
			<ButtonGroup minimal={true}>
				<ButtonLink className="zr-text-small" href={link_pdf} icon="paperclip" >Open PDF</ButtonLink>
				<ButtonLink className="zr-text-small" href={link_page}>Page {pageLabel}</ButtonLink>
			</ButtonGroup>
		</div>
		{text && <div className="zr-annotation--highlight">
			<span style={highlightStyle}>{text}</span>
		</div>}
		{type == "image" && <code className={Classes.CODE}>Images are currently not supported</code>}
		{comment && <div className="zr-annotation--comment">{comment}</div>}
		<div className="zr-annotation--footer">
			<span className="zr-auxiliary">{makeDateFromAgo(dateModified)}</span>
		</div>
	</div>;
}
Annotation.propTypes = {
	annot: customPropTypes.cleanAnnotationItemType
};

function PanelAnnotations({ annots }){
	let clean_annotations = simplifyAnnotations(annots)
		.sort((a,b) => compareAnnotationIndices(a.sortIndex, b.sortIndex));

	return clean_annotations.map(annot => <Annotation key={annot.key} annot={annot} /> );
}
PanelAnnotations.propTypes = {
	annots: arrayOf(object)
};

function PanelNotes({ notes }){
	return notes.map((n, i) => 
		<Card key={i} className={["zr-drawer--notes-card", "zr-text-small"].join(" ")}>
			{n}
		</Card>
	);
}
PanelNotes.propTypes = {
	notes: arrayOf(string)
};

const NotesDrawer = React.memo(function NotesDrawer(props){
	const { isOpen, notes, onClose/*, title*/ } = props;
	const { notes: notesSettings } = useContext(UserSettings);

	const annots = useMemo(() => notes.filter(n => n.data.itemType == "annotation"), [notes]);

	const cleanNotes = useMemo(() => {
		let noteItems = notes.filter(n => n.data.itemType == "note");
		return formatZoteroNotes(noteItems, notesSettings);
	}, [notes, notesSettings]);

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
				{cleanNotes.length > 0 && <Tab id="notes" panel={<PanelNotes notes={cleanNotes} />} title="Notes" />}
				<Tabs.Expander />
				<Button icon="cross" minimal={true} onClick={onClose} />
			</Tabs>
		</Drawer>
	);
});
NotesDrawer.propTypes = {
	isOpen: bool,
	notes: arrayOf(object),
	onClose: func,
	title: string
};

export default NotesDrawer;
