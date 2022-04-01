import React, { useContext, useMemo } from "react";
import { arrayOf, bool, func, object, string } from "prop-types";
import { Button, Card, Classes, Drawer, Icon, Tabs, Tab, Tag } from "@blueprintjs/core";

import { UserSettings } from "../App";
import { formatZoteroNotes } from "../../utils";

import "./index.css";

function PanelAnnotations({ annots }){
	return annots.map(ann => {
		let { annotationColor, annotationComment, annotationPageLabel, annotationText, dateModified, tags } = ann.data;

		return <Card key={ann.key} className={["zr-drawer--notes-card", "zr-text-small"].join(" ")}>
			{annotationText && <div className={Classes.BLOCKQUOTE}>{annotationText} (page {annotationPageLabel}))</div>}
			{annotationComment}
			{tags.map((t, j) => <Tag key={j} >{t.tag}</Tag>)}
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
			<Tabs id="zr-drawer--notes" >
				{cleanNotes.length > 0 && <Tab id="notes" panel={<PanelNotes notes={cleanNotes} />} title="Notes" />}
				{annots.length > 0 && <Tab id="annotations" panel={<PanelAnnotations annots={annots} />} title="Annotations" />}
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
