import { memo, useMemo } from "react";
import { Button, ButtonGroup, Classes, Dialog, Drawer, DrawerProps, Icon, Tab, Tabs, Tag } from "@blueprintjs/core";

import ButtonLink from "Components/ButtonLink";
import { ErrorBoundary } from "Components/Errors";
import { useNotesSettings } from "Components/UserSettings";

import { useBool } from "@hooks";

import { simplifyZoteroNotes } from "./helpers";

import { CustomClasses } from "../../constants";
import { compareAnnotationIndices, formatZoteroNotes, makeDateFromAgo, simplifyZoteroAnnotations } from "../../utils";
import { ZItemAnnotation, ZItemNote, ZSimplifiedAnnotation, ZSimplifiedNote, isZAnnotation, isZNote } from "Types/transforms";

import "./_index.sass";


type ShowRawProps = {
	item: ZItemAnnotation | ZItemNote
};

function ShowRaw({ item }: ShowRawProps){
	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);

	return <>
		<Button icon="eye-open" minimal={true} onClick={openDialog} />
		<Dialog canEscapeKeyClose={false} className="zr-raw-item-dialog" isOpen={isDialogOpen} lazy={true} onClose={closeDialog} >
			<div className={Classes.DIALOG_BODY}>
				<pre className={[Classes.CODE_BLOCK, CustomClasses.TEXT_AUXILIARY].join(" ")}>{JSON.stringify(item, null, "  ")}</pre>
			</div>
		</Dialog>
	</>;
}


type AnnotationProps = {
	annot: ZSimplifiedAnnotation
};

function Annotation({ annot }: AnnotationProps){
	const { color, comment, date_modified, link_page, link_pdf, page_label, raw, tags, text, type } = annot;

	// https://shannonpayne.com.au/how-to-create-a-low-highlight-text-effect-using-css/
	const highlightStyle = useMemo(() => ({
		"backgroundImage": `linear-gradient(120deg, ${color}50 0%, ${color}50 100%)`
	}), [color]);

	return <div className={[CustomClasses.PREFIX_DRAWER + "notes-card", CustomClasses.TEXT_SMALL].join(" ")}>
		<div zr-role="card-header">
			<span>{tags.map((tag, j) => <Tag key={j} minimal={true} >{tag}</Tag>)}</span>
			<ButtonGroup minimal={true}>
				<ShowRaw item={raw} />
				<ButtonLink className={CustomClasses.TEXT_SMALL} href={link_pdf} icon="paperclip" >PDF</ButtonLink>
				<ButtonLink className={CustomClasses.TEXT_SMALL} href={link_page} >Page {page_label}</ButtonLink>
			</ButtonGroup>
		</div>
		<div className="zr-annotation--highlight">
			{text && <span style={highlightStyle}>{text}</span>}
			{type == "image" && <code className={Classes.CODE}>Images are currently not supported</code>}
		</div>
		{comment && <div className="zr-annotation--comment"><Icon icon="nest" intent="primary" size={14} />{comment}</div>}
		<div zr-role="card-footer">
			<span className={CustomClasses.TEXT_SECONDARY}>{makeDateFromAgo(date_modified)}</span>
		</div>
	</div>;
}


type NoteProps = {
	note: ZSimplifiedNote
};

function Note({ note }: NoteProps){
	const { date_modified, link_note, raw, tags } = note;
	const [notesSettings] = useNotesSettings();

	const notesList = useMemo(() => formatZoteroNotes([raw], notesSettings), [notesSettings, raw]);

	return <div className={[CustomClasses.PREFIX_DRAWER + "notes-card", CustomClasses.TEXT_SMALL].join(" ")}>
		<div zr-role="card-header">
			<span>{tags.map((tag, j) => <Tag key={j} minimal={true} >{tag}</Tag>)}</span>
			<ButtonGroup minimal={true}>
				<ShowRaw item={raw} />
				<ButtonLink className={CustomClasses.TEXT_SMALL} href={link_note} icon="comment">View in Zotero</ButtonLink>
			</ButtonGroup>
		</div>
		{notesList.map((nt, i) => (
			<div key={i} className="zr-note--contents">
				{nt}
			</div>
		))}
		<div zr-role="card-footer">
			<span className={CustomClasses.TEXT_SECONDARY}>{makeDateFromAgo(date_modified)}</span>
		</div>
	</div>;
}


type PanelAnnotationsProps = {
	annots: ZItemAnnotation[]
};

function PanelAnnotations({ annots }: PanelAnnotationsProps){
	const clean_annotations = simplifyZoteroAnnotations(annots)
		.sort((a,b) => compareAnnotationIndices(a.sortIndex, b.sortIndex));

	return <>{clean_annotations.map(annot => <Annotation key={annot.key} annot={annot} /> )}</>;
}


type PanelNotesProps = {
	notes: ZItemNote[]
};

function PanelNotes({ notes }: PanelNotesProps){
	const clean_notes = simplifyZoteroNotes(notes);

	return <>{clean_notes.map(nt => <Note key={nt.key} note={nt} />)}</>;
}


type NotesDrawerProps = {
	notes: (ZItemAnnotation|ZItemNote)[]
};

const NotesDrawer = memo<NotesDrawerProps & Pick<DrawerProps, "isOpen" | "onClose">>(function NotesDrawer(props){
	const { isOpen, notes, onClose } = props;

	const annots = useMemo(() => notes.filter(isZAnnotation), [notes]);
	const noteItems = useMemo(() => notes.filter(isZNote), [notes]);

	return (
		<Drawer
			canEscapeKeyClose={false}
			canOutsideClickClose={true}
			className={CustomClasses.PREFIX_DRAWER + "notes"}
			isOpen={isOpen}
			lazy={false}
			onClose={onClose}
			size="40%" >
			<ErrorBoundary>
				<Tabs animate={false} className={CustomClasses.TABS_MINIMAL} id="zr-drawer--notes" >
					{annots.length > 0 && <Tab id="annotations" panel={<PanelAnnotations annots={annots} />} title="Annotations" />}
					{noteItems.length > 0 && <Tab id="notes" panel={<PanelNotes notes={noteItems} />} title="Notes" />}
					<Tabs.Expander />
					<Button icon="cross" minimal={true} onClick={onClose} />
				</Tabs>
			</ErrorBoundary>
		</Drawer>
	);
});


export default NotesDrawer;
