import React, { useContext, useMemo } from "react";
import { arrayOf, bool, func, object, string } from "prop-types";
import { Card, Classes, Drawer, Icon, Tabs, Tab, Tag } from "@blueprintjs/core";

import { UserSettings } from "../App";
import { formatZoteroAnnotations, formatZoteroNotes } from "../../utils";

import * as customPropTypes from "../../propTypes";

import "./index.css";

function PanelAnnotations({ annots }){
	return annots.map((a, i) => {
		let { annotationColor, annotationComment, annotationPageLabel, annotationText, dateModified, tags } = a;

		return <Card key={i} className={["zr-drawer--notes-card", "zr-text-small"].join(" ")}>
			{annotationText && <div className={Classes.BLOCKQUOTE}>{annotationText} (page {annotationPageLabel}))</div>}
			{annotationComment}
			{tags.map((t, i) => <Tag key={i} >t.tag</Tag>)}
			<Icon color={annotationColor} icon="chat" />
			{dateModified}
		</Card>;
	});
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
	notes: arrayOf(customPropTypes.zoteroItemType)
};

const NotesDrawer = React.memo(function NotesDrawer(props){
	const { isOpen, notes, onClose, title } = props;
	const { notes: notesSettings } = useContext(UserSettings);

	const cleanAnnots = useMemo(() => {
		let annots = notes.filter(n => n.data.itemType == "annotation");
		return formatZoteroAnnotations(annots);
	}, [notes]);

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
			size="40%"
			title={title} >
			<Tabs id="zr-drawer--notes" >
				{cleanNotes.length > 0 && <Tab id="notes" panel={<PanelNotes notes={cleanNotes} />} title="Notes" />}
				{cleanAnnots.length > 0 && <Tab id="annotations" panel={<PanelAnnotations annots={cleanAnnots} />} title="Annotations" />}
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
