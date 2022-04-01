import React, { useContext, useMemo } from "react";
import { arrayOf, bool, func, object, string } from "prop-types";
import { Button, Card, Drawer, Tabs, Tab, Tag, Divider, Icon } from "@blueprintjs/core";

import { UserSettings } from "../App";
import ButtonLink from "../ButtonLink";
import { formatZoteroNotes, makeDateFromAgo, simplifyAnnotations } from "../../utils";

import "./index.css";

function PanelAnnotations({ annots }){
	let clean_annotations = simplifyAnnotations(annots);

	return clean_annotations.map(ann => {
		let { color, comment, pageLabel, text, dateModified, link_page, link_pdf, tags } = ann;
		let highlightStyle = {
			"background": `linear-gradient(120deg, ${color}50 0%, ${color}50 100%)`
		};

		return <Card key={ann.key} className={["zr-drawer--notes-card", "zr-text-small"].join(" ")}>
			<div className="zr-annotation--header">
				<ButtonLink href={link_pdf}><Icon icon="document-open" />Open PDF</ButtonLink>
				<a href={link_page} rel="noreferrer" target="_blank" >Page {pageLabel}</a>
			</div>
			<Divider />
			{text && <span className="zr-annotation--highlight" style={highlightStyle}>{text}</span>}
			{comment}
			<Divider />
			<div className="zr-annotation--footer">
				{tags.map((t, j) => <Tag key={j} >{t.tag}</Tag>)}
				<span className="zr-auxiliary">{makeDateFromAgo(dateModified)}</span>
			</div>
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
