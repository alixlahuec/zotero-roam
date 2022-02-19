import React, { useCallback, useContext, useMemo, useState } from "react";
import { bool, func, object, oneOf, string } from "prop-types";
import { Button, ButtonGroup, Classes, Divider, Menu, MenuItem, Tag, useHotkeys } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import ButtonLink from "../ButtonLink";
import NotesDrawer from "../NotesDrawer";
import ShortcutSequence from "../ShortcutSequence";
import { useRoamCitekeys } from "../RoamCitekeysContext";

import { importItemMetadata, importItemNotes, openPageByUID } from "../../roam";
import { copyToClipboard } from "../../utils";
import { formatItemReferenceForCopy } from "../SearchPanel/utils";

import { UserSettings } from "../App";
import * as customPropTypes from "../../propTypes";
import "./index.css";

function CopyOption(props){
	let { citekey, format, item, text } = props;

	const formatCitekey = useCallback(() => {
		let output;
		let pageRef = "[[@" + citekey + "]]";
  
		switch(format){
		case "page-reference":
			output = pageRef;
			break;
		case "tag":
			output = "#" + pageRef;
			break;
		case "citation":
			output = "[" + item.authors + " (" + item.year + ")](" + pageRef + ")";
			break;
		case "citekey":
		default:
			output = "@" + citekey;
			break;
		}
    
		copyToClipboard(output);
	}, [citekey, format, item]);
  
	return <MenuItem icon="clipboard" onClick={formatCitekey} text={text} />;
}
CopyOption.propTypes = {
	citekey: string,
	format: oneOf(["citation", "citekey", "page-reference", "tag"]),
	item: object,
	text: string,
};

function CopyButtons(props){
	const { citekey, inGraph, item } = props;
	const { copy: { defaultFormat: defaultCopyFormat} } = useContext(UserSettings);

	const defaultCopyText = useMemo(() => {
		return formatItemReferenceForCopy(item, defaultCopyFormat);
	}, [defaultCopyFormat, item]);

	const copyDefault = useCallback(() => {
		copyToClipboard(defaultCopyText);
	}, [defaultCopyText]);

	const optionsMenu = useMemo(() => {
		let options = [
			{ format: "citekey", text: "...as @citekey" },
			{ format: "tag", text: "...as #@citekey" },
			{ format: "page-reference", text: "...as [[@citekey]]" },
			{ format: "citation", text: "...as [Citation]([[@]])" }
		].filter(op => op.format != defaultCopyFormat);
		return (
			<Menu className="zr-text-small">
				{options.map(op => <CopyOption key={op.format} citekey={citekey} item={item} {...op} />)}
			</Menu>
		);
	}, [citekey, defaultCopyFormat, item]);

	return (
		<ButtonGroup className="copy-buttons" fill={true} minimal={true} >
			<Button className="zr-text-small"
				fill={true} 
				icon="clipboard"
				intent={inGraph ? "success" : "warning"}
				text={defaultCopyText} 
				onClick={copyDefault} />
			<Popover2 interactionKind="hover" placement="right-start" popoverClassName="zr-popover" content={optionsMenu} >
				<Button icon="caret-right" intent={inGraph ? "success" : "warning"} />
			</Popover2>
		</ButtonGroup>
	);
}
CopyButtons.propTypes = {
	citekey: string,
	inGraph: bool,
	item: object
};

const ItemDetails = React.memo(function ItemDetails({ closeDialog, item }) {
	const {
		abstract, 
		authors, 
		authorsFull, 
		authorsRoles,
		children, 
		inGraph, 
		key, 
		publication,
		tags, 
		title, 
		weblink, 
		year,
		zotero} = item;
	const [isNotesDrawerOpen, setNotesDrawerOpen] = useState(false);
	const { metadata: metadataSettings, notes: notesSettings, shortcuts: shortcutsSettings } = useContext(UserSettings);
	const [, updateRoamCitekeys] = useRoamCitekeys();

	const importMetadata = useCallback(async() => {
		const { pdfs = [], notes = [] } = children;
		const outcome = await importItemMetadata({item: item.raw, pdfs, notes }, inGraph, metadataSettings);
		if(outcome.success){
			updateRoamCitekeys();
		}
		return outcome;
	}, [children, inGraph, item.raw, metadataSettings, updateRoamCitekeys]);

	const importNotes = useCallback(async() => {
		return await importItemNotes({ item, notes: children.notes }, inGraph, notesSettings);
	}, [children.notes, inGraph, item, notesSettings]);
	
	const navigateToPage = useCallback(() => {
		if(inGraph != false){
			openPageByUID(inGraph);
			closeDialog();
		}
	}, [closeDialog, inGraph]);

	const showNotes = useCallback(() => setNotesDrawerOpen(true), []);
	const closeNotes = useCallback(() => setNotesDrawerOpen(false), []);
	const toggleNotes = useCallback(() => setNotesDrawerOpen(prev => !prev), []);

	const goToPageButton = useMemo(() => {
		let btnText = <>
			Go to Roam page
			{shortcutsSettings.goToItemPage != false
				? <ShortcutSequence text={shortcutsSettings.goToItemPage} />
				: null}
		</>;
		return inGraph 
			? <Button text={btnText}
				className="item-go-to-page"
				icon="arrow-right"
				onClick={navigateToPage} />
			: null;
	}, [inGraph, navigateToPage, shortcutsSettings]);

	const pdfs = useMemo(() => {
		if(children.pdfs.length == 0){
			return null;
		} else {
			let firstElem = children.pdfs[0];
			let libLoc = firstElem.library.type == "group" ? `groups/${firstElem.library.id}` : "library";
            
			return (
				<ButtonGroup minimal={true} fill={true} alignText="left">
					{children.pdfs.map((p, i) => {
						let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(p.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${p.data.key}` : p.data.url;
						return <ButtonLink key={i} className="item-pdf-link" href={pdfHref} icon="paperclip" text={p.data.filename || p.data.title} />;
					} )}
				</ButtonGroup>
			);
		}
	}, [children.pdfs]);

	const notes = useMemo(() => {
		if(children.notes.length == 0){
			return null;
		} else {
			let btnText = <>
				Show notes
				{shortcutsSettings.toggleNotes != false
					? <ShortcutSequence text={shortcutsSettings.toggleNotes} />
					: null}
			</>;
			return (
				<>
					<ButtonGroup minimal={true} fill={true} alignText="left">
						<Button icon="comment" text={btnText} onClick={showNotes} />
					</ButtonGroup>
					<NotesDrawer isOpen={isNotesDrawerOpen} notes={children.notes} onClose={closeNotes} title={"Notes for @" + key} />
				</>
			);
		}
	}, [children.notes, closeNotes, isNotesDrawerOpen, key, shortcutsSettings, showNotes]);

	const hotkeys = useMemo(() => {
		const { goToItemPage: pageCombo, toggleNotes: notesCombo } = shortcutsSettings;
		const defaultProps = {
			allowInInput: false,
			group: "Item Details",
			preventDefault: true,
			stopPropagation: true
		};

		let shortcutsList = [];

		if(pageCombo){
			shortcutsList.push({
				...defaultProps,
				combo: pageCombo,
				disabled: !inGraph,
				label: "Go to the item's Roam page",
				onKeyDown: navigateToPage
			});
		}
		if(notesCombo){
			shortcutsList.push({
				...defaultProps,
				combo: notesCombo,
				disabled: children.notes.length == 0,
				label: "Show the item's linked notes",
				onKeyDown: toggleNotes
			});
		}

		return shortcutsList;

	}, [children.notes, inGraph, navigateToPage, shortcutsSettings, toggleNotes]);

	const { handleKeyUp, handleKeyDown } = useHotkeys(hotkeys, {showDialogKeyCombo: "shift+Z+R"});

	return <div id="zr-item-details" onKeyUp={handleKeyUp} onKeyDown={handleKeyDown} >
		<div className="selected-item-header">
			<div className="item-basic-metadata">
				<h4 className="item-title">{title}</h4>
				<span className="zr-highlight">{authors + " (" + year + ")"}</span>
				{publication
					? <span className="zr-secondary">{publication}</span>
					: null}
				{weblink
					? <span className="item-weblink zr-secondary" style={{ display: "block" }}>
						<a href={weblink.href} target="_blank" rel="noreferrer">{weblink.title}</a>
					</span>
					: null}
			</div>
			<div className="item-citekey-section" data-in-graph={inGraph.toString()}>
				{navigator.clipboard
					? <CopyButtons citekey={key} inGraph={inGraph != false} item={item} />
					: <div className={[Classes.FILL, "citekey-element"].join(" ")}>@{key}</div>}
			</div>
		</div>
		<div className="selected-item-body">
			<div className="item-additional-metadata">
				<p className={"item-abstract zr-text-small " + Classes.RUNNING_TEXT}>{abstract}</p>
				{authorsFull.length > 0
					? <p className="item-creators">
						<strong>Contributors : </strong>
						{authorsFull.map((aut, i) => <Tag key={i} intent="primary" className="item-creator-tag" >{aut}{authorsRoles[i] == "author" ? "" : " (" + authorsRoles[i] + ")"}</Tag>)}
					</p>
					: null}
				{tags.length > 0
					? <p className="item-tags">
						<strong>Tags : </strong>
						{tags.map((tag, i) => <Tag key={i}>#{tag}</Tag>)}
					</p>
					: null}
			</div>
			<div className="item-actions">
				<div className={Classes.CARD}>
					<ButtonGroup alignText="left" fill={true} minimal={true} vertical={true} >
						{goToPageButton}
						<Button text="Import item metadata"
							className="item-add-metadata"
							icon="add"
							onClick={importMetadata} />
						{children.notes.length > 0
							? <Button text="Add notes" className="item-add-notes" icon="chat" onClick={importNotes} />
							: null}
					</ButtonGroup>
					<Divider />
					<ButtonGroup alignText="left" fill={true} minimal={true} vertical={true} >
						<ButtonLink href={zotero.local} icon="application" text="Open in Zotero" />
						<ButtonLink href={zotero.web} icon="cloud" text="Open in Zotero (web)" />
					</ButtonGroup>
				</div>
				{pdfs}
				{notes}
			</div>
		</div>
	</div>;
});
ItemDetails.propTypes = {
	closeDialog: func,
	item: customPropTypes.cleanLibraryItemType
};

export default ItemDetails;
