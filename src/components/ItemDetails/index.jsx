import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, object, oneOf, string } from "prop-types";
import { Classes, Icon, Menu, MenuDivider, MenuItem, Tag, useHotkeys } from "@blueprintjs/core";

import NotesDrawer from "../NotesDrawer";
import ShortcutSequence from "../ShortcutSequence";
import { useRoamCitekeys } from "../RoamCitekeysContext";

import { importItemMetadata, importItemNotes, openPageByUID } from "../../roam";
import { copyToClipboard, makeDNP } from "../../utils";
import { formatItemReferenceForCopy } from "../SearchPanel/utils";

import { UserSettings } from "../App";
import * as customPropTypes from "../../propTypes";
import "./index.css";

const copyPopoverProps = {
	popoverClassName: "zr-popover"
};

function CopyOption(props){
	let { citekey, format, item } = props;

	const textOutput = useMemo(() => {
		let pageRef = "[[@" + citekey + "]]";
  
		switch(format){
		case "page-reference":
			return pageRef;
		case "tag":
			return "#" + pageRef;
		case "citation":
			return "[" + item.authors + " (" + item.year + ")](" + pageRef + ")";
		case "citekey":
		default:
			return "@" + citekey;
		}
	}, [citekey, format, item]);

	const formatCitekey = useCallback(() => copyToClipboard(textOutput), [textOutput]);

	const label = useMemo(() => {
		switch(format){
		case "page-reference":
			return "REF";
		case "tag":
			return "TAG";
		case "citation":
			return "CIT";
		case "citekey":
			return "KEY";
		default:
			return null;
		}
	}, [format]);
  
	return <MenuItem htmlTitle={textOutput} labelElement={label && <Tag minimal={true}>{label}</Tag>} onClick={formatCitekey} text={textOutput} />;
}
CopyOption.propTypes = {
	citekey: string,
	format: oneOf(["citation", "citekey", "page-reference", "tag"]),
	item: object
};

function CopyButtons(props){
	const { citekey, item } = props;
	const { copy: { defaultFormat: defaultCopyFormat} } = useContext(UserSettings);

	const defaultCopyText = useMemo(() => {
		return formatItemReferenceForCopy(item, defaultCopyFormat);
	}, [defaultCopyFormat, item]);

	const copyDefault = useCallback(() => {
		copyToClipboard(defaultCopyText);
	}, [defaultCopyText]);

	const optionsMenu = useMemo(() => {
		let standardOptions = ["citekey", "tag", "page-reference", "citation"]
			.filter(op => op != defaultCopyFormat)
			.map(op => <CopyOption key={op} citekey={citekey} format={op} item={item} />);
		return <>
			<MenuItem htmlTitle={defaultCopyText} labelElement={<Tag intent="success" minimal={true}>Default</Tag>} onClick={copyDefault} text={defaultCopyText} />
			{standardOptions}
		</>;
	}, [citekey, copyDefault, defaultCopyFormat, defaultCopyText, item]);

	return <MenuItem 	
		icon="clipboard"
		multiline={true} 
		onClick={copyDefault} 
		popoverProps={copyPopoverProps}
		text="Copy reference" >
		{optionsMenu}
	</MenuItem>;
}
CopyButtons.propTypes = {
	citekey: string,
	item: object
};

const ItemDetails = React.memo(function ItemDetails({ closeDialog, item }) {
	const {
		abstract, 
		authors, 
		authorsFull, 
		authorsRoles,
		children, 
		createdByUser,
		inGraph, 
		key, 
		location,
		publication,
		raw,
		tags, 
		title, 
		weblink, 
		year,
		zotero} = item;
	const [isNotesDrawerOpen, setNotesDrawerOpen] = useState(false);
	const { metadata: metadataSettings, notes: notesSettings, shortcuts: shortcutsSettings, typemap } = useContext(UserSettings);
	const [, updateRoamCitekeys] = useRoamCitekeys();

	const importMetadata = useCallback(async() => {
		const { pdfs = [], notes = [] } = children;
		const outcome = await importItemMetadata({item: item.raw, pdfs, notes }, inGraph, metadataSettings, typemap, notesSettings);
		if(outcome.success){
			updateRoamCitekeys();
		}
		return outcome;
	}, [children, inGraph, item.raw, metadataSettings, notesSettings, typemap, updateRoamCitekeys]);

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
		let label = shortcutsSettings.goToItemPage != false
			? <ShortcutSequence text={shortcutsSettings.goToItemPage} />
			: null;
		return inGraph 
			? <MenuItem icon="arrow-right" labelElement={label} onClick={navigateToPage} text="Go to Roam page" />
			: null;
	}, [inGraph, navigateToPage, shortcutsSettings]);

	const pdfs = useMemo(() => {
		if(children.pdfs.length == 0){
			return null;
		} else {
			let firstElem = children.pdfs[0];
			let libLoc = firstElem.library.type == "group" ? `groups/${firstElem.library.id}` : "library";
            
			return children.pdfs.map(p => {
				let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(p.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${p.data.key}` : p.data.url;
				return <MenuItem key={p.key} href={pdfHref} icon="paperclip" multiline={true} rel="noreferrer" target="_blank" text={p.data.filename || p.data.title} />;
			});
		}
	}, [children.pdfs]);

	const notes = useMemo(() => {
		if(children.notes.length == 0){
			return null;
		} else {
			let label = shortcutsSettings.toggleNotes != false
				? <ShortcutSequence text={shortcutsSettings.toggleNotes} />
				: null;
			return <>
				<MenuItem icon="highlight" labelElement={label} onClick={showNotes} text="Highlights & Notes" />
				<NotesDrawer isOpen={isNotesDrawerOpen} notes={children.notes} onClose={closeNotes} />
			</>;
		}
	}, [children.notes, closeNotes, isNotesDrawerOpen, shortcutsSettings, showNotes]);

	const hotkeys = useMemo(() => {
		const { goToItemPage: pageCombo, toggleNotes: notesCombo } = shortcutsSettings;
		const defaultProps = {
			allowInInput: false,
			global: true,
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
				onKeyDown: () => navigateToPage()
			});
		}
		if(notesCombo){
			shortcutsList.push({
				...defaultProps,
				combo: notesCombo,
				disabled: children.notes.length == 0,
				label: "Show the item's linked notes",
				onKeyDown: () => toggleNotes()
			});
		}

		return shortcutsList;

	}, [children.notes, inGraph, navigateToPage, shortcutsSettings, toggleNotes]);

	useHotkeys(hotkeys, {showDialogKeyCombo: "shift+Z+R"});

	return <div id="zr-item-details">
		<div zr-role="item-metadata">
			<div zr-role="item-metadata--header">
				<h5>{title}</h5>
				<span className="zr-highlight">{authors + " (" + year + ")"}</span>
				{publication
					? <span className="zr-secondary">{publication}</span>
					: null}
				{weblink
					? <span zr-role="item-weblink" className="zr-secondary" >
						<a href={weblink.href} rel="noreferrer" target="_blank" >{weblink.title}</a>
					</span>
					: null}
			</div>
			<p zr-role="item-abstract" className={["zr-text-small", Classes.RUNNING_TEXT].join(" ")}>
				{abstract}
			</p>
			<div zr-role="item-metadata--footer">
				{authorsFull.length > 0
					? <>
						<span>Contributors</span>
						<div>
							{authorsFull.map((aut, i) => <Tag key={i} className="zr-text-small" intent="primary" minimal={true}>{aut}{authorsRoles[i] == "author" ? "" : " (" + authorsRoles[i] + ")"}</Tag>)}
						</div>
					</>
					: null}
				{tags.length > 0
					? <>
						<span>Tags</span>
						<div>
							{tags.map((tag, i) => <Tag key={i} className="zr-text-small" minimal={true}>#{tag}</Tag>)}
						</div>
					</>
					: null}
			</div>
		</div>
		<div zr-role="item-actions">
			<div>
				<Tag fill={true} large={true} minimal={true} round={true}>{location}</Tag>
				<span><Icon icon="calendar" />{makeDNP(raw.data.dateAdded, { brackets: false })}</span>
				{createdByUser && <span><Icon icon="person" />Added by {createdByUser}</span>}
				{inGraph && <span><Icon icon="graph" intent="success" />In Roam</span>}
			</div>
			<Menu className="zr-text-small" data-in-graph={inGraph.toString()} >
				{navigator.clipboard && <CopyButtons citekey={key} item={item} />}
				<MenuDivider className="zr-divider-minimal" title="Actions" />
				{goToPageButton}
				<MenuItem icon="add" onClick={importMetadata} text="Import metadata" />
				{children.notes.length > 0 && <MenuItem icon="chat" onClick={importNotes} text="Import notes" />}
				<MenuItem href={zotero.local} icon="application" rel="noreferrer" target="_blank" text="Open in Zotero" />
				<MenuItem href={zotero.web} icon="cloud" rel="noreferrer" target="_blank" text="Open in Zotero (web)" />
				<MenuDivider className="zr-divider-minimal" title="Linked Content" />
				{pdfs}
				{notes}
			</Menu>
		</div>
	</div>;
});
ItemDetails.propTypes = {
	closeDialog: func,
	item: customPropTypes.cleanLibraryItemType
};

export default ItemDetails;
