import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node, object, oneOf, string } from "prop-types";
import { Classes, Menu, MenuDivider, MenuItem, Tag, useHotkeys } from "@blueprintjs/core";

import DataDrawer from "../DataDrawer";
import NotesDrawer from "../NotesDrawer";
import ShortcutSequence from "../ShortcutSequence";
import { useRoamCitekeys } from "../RoamCitekeysContext";

import { importItemMetadata, importItemNotes, openPageByUID } from "../../roam";
import { copyToClipboard, makeDateFromAgo } from "../../utils";
import { formatItemReferenceForCopy } from "../SearchPanel/utils";

import { UserSettings } from "../App";
import * as customPropTypes from "../../propTypes";
import "./index.css";

const copyPopoverProps = {
	popoverClassName: "zr-popover"
};

/** Creates a formatted reference to an item
 * @param {String} citekey - The item's citekey
 * @param {("citation"|"citekey"|"page-reference"|"tag")} format 
 * @param {ZoteroItem} item - The Zotero item
 * @returns The formatted reference
 */
const makeItemReference = (citekey, format, item) => {
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
};

function CopyOption(props){
	let { citekey, format, item } = props;
	const { shortcuts: shortcutsSettings } = useContext(UserSettings);

	const textOutput = useMemo(() => makeItemReference(citekey, format, item), [citekey, format, item]);
	const formatCitekey = useCallback(() => copyToClipboard(textOutput), [textOutput]);

	const label = useMemo(() => {
		const {
			copyCitation: citationCombo,
			copyCitekey: citekeyCombo,
			copyPageRef: pageRefCombo,
			copyTag: tagCombo
		} = shortcutsSettings;

		switch(format){
		case "page-reference":
			return pageRefCombo != false
				? <ShortcutSequence text={pageRefCombo} />
				: <Tag minimal={true}>REF</Tag>;
		case "tag":
			return tagCombo != false
				? <ShortcutSequence text={tagCombo} /> 
				: <Tag minimal={true}>TAG</Tag>;
		case "citation":
			return citationCombo != false
				? <ShortcutSequence text={citationCombo} />
				: <Tag minimal={true}>CIT</Tag>;
		case "citekey":
			return citekeyCombo != false
				? <ShortcutSequence text={citekeyCombo} />
				: <Tag minimal={true}>KEY</Tag>;
		default:
			return null;
		}
	}, [format, shortcutsSettings]);
  
	return <MenuItem htmlTitle={textOutput} labelElement={label} onClick={formatCitekey} text={textOutput} />;
}
CopyOption.propTypes = {
	citekey: string,
	format: oneOf(["citation", "citekey", "page-reference", "tag"]),
	item: object
};

function CopyButtons(props){
	const { citekey, item } = props;
	const { copy: { defaultFormat: defaultCopyFormat}, shortcuts: shortcutsSettings } = useContext(UserSettings);

	const defaultCopyText = useMemo(() => {
		return formatItemReferenceForCopy(item, defaultCopyFormat);
	}, [defaultCopyFormat, item]);

	const copyAsDefault = useCallback(() => {
		copyToClipboard(defaultCopyText);
	}, [defaultCopyText]);

	const optionsMenu = useMemo(() => {
		let standardOptions = ["citekey", "tag", "page-reference", "citation"]
			.filter(op => op != defaultCopyFormat)
			.map(op => <CopyOption key={op} citekey={citekey} format={op} item={item} />);
		return <>
			<MenuItem htmlTitle={defaultCopyText} labelElement={<Tag intent="success" minimal={true}>Default</Tag>} onClick={copyAsDefault} text={defaultCopyText} />
			{standardOptions}
		</>;
	}, [citekey, copyAsDefault, defaultCopyFormat, defaultCopyText, item]);

	const label = useMemo(() => {
		return shortcutsSettings.copyDefault != false
			? <ShortcutSequence text={shortcutsSettings.copyDefault} />
			: null;
	}, [shortcutsSettings]);

	const hotkeys = useMemo(() => {
		const defaultProps = {
			allowInInput: false,
			global: true,
			preventDefault: true,
			stopPropagation: true
		};

		let configs = {
			"copyDefault": {
				label: "Copy the item in view (default format)",
				onKeyDown: () => copyAsDefault()
			},
			"copyCitation": {
				label: "Copy the item in view (as citation)",
				onKeyDown: () => copyToClipboard(makeItemReference(citekey, "citation", item))
			},
			"copyCitekey": {
				label: "Copy the item in view (as citekey)",
				onKeyDown: () => copyToClipboard(makeItemReference(citekey, "citekey", item))
			},
			"copyPageRef": {
				label: "Copy the item in view (as page reference)",
				onKeyDown: () => copyToClipboard(makeItemReference(citekey, "page-reference", item))
			},
			"copyTag": {
				label: "Copy the item in view (as page reference)",
				onKeyDown: () => copyToClipboard(makeItemReference(citekey, "tag", item))
			}
		};

		return Object.keys(shortcutsSettings)
			.filter(k => Object.keys(configs).includes(k) && shortcutsSettings[k] != false)
			.map(k => {
				return {
					...defaultProps,
					...configs[k],
					combo: shortcutsSettings[k]
				};
			});

	}, [citekey, copyAsDefault, item, shortcutsSettings]);

	useHotkeys(hotkeys, {showDialogKeyCombo: "shift+Z+R"});

	return <MenuItem 	
		icon="clipboard"
		labelElement={label}
		multiline={true} 
		onClick={copyAsDefault} 
		popoverProps={copyPopoverProps}
		text="Copy reference" >
		{optionsMenu}
	</MenuItem>;
}
CopyButtons.propTypes = {
	citekey: string,
	item: object
};

function Metadata({ direction = "row", label, children }){
	return <div zr-role={"metadata-" + direction}>
		<span className="zr-auxiliary">{label}</span>
		<div>{children}</div>
	</div>;
}
Metadata.propTypes = {
	children: node,
	direction: oneOf(["col", "row"]),
	label: string
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
		publication,
		raw,
		tags, 
		title, 
		weblink, 
		year,
		zotero} = item;
	const [isNotesDrawerOpen, setNotesDrawerOpen] = useState(false);
	const [isDataDrawerOpen, setDataDrawerOpen] = useState(false);
	
	const { 
		annotations: annotationsSettings, 
		metadata: metadataSettings, 
		notes: notesSettings, 
		shortcuts: shortcutsSettings, 
		typemap } = useContext(UserSettings);
	const [, updateRoamCitekeys] = useRoamCitekeys();

	const importMetadata = useCallback(async() => {
		const { pdfs = [], notes = [] } = children;
		const outcome = await importItemMetadata({item: item.raw, pdfs, notes }, inGraph, metadataSettings, typemap, notesSettings, annotationsSettings);
		if(outcome.success){
			updateRoamCitekeys();
		}
		return outcome;
	}, [annotationsSettings, children, inGraph, item.raw, metadataSettings, notesSettings, typemap, updateRoamCitekeys]);

	const importNotes = useCallback(async() => {
		const outcome = await importItemNotes({ item, notes: children.notes }, inGraph, notesSettings, annotationsSettings);
		if(outcome.success){
			updateRoamCitekeys();
		}
		return outcome;
	}, [annotationsSettings, children.notes, inGraph, item, notesSettings, updateRoamCitekeys]);
	
	const navigateToPage = useCallback(() => {
		if(inGraph != false){
			openPageByUID(inGraph);
			closeDialog();
		}
	}, [closeDialog, inGraph]);

	const showNotes = useCallback(() => setNotesDrawerOpen(true), []);
	const closeNotes = useCallback(() => setNotesDrawerOpen(false), []);
	const toggleNotes = useCallback(() => setNotesDrawerOpen(prev => !prev), []);

	const showData = useCallback(() => setDataDrawerOpen(true), []);
	const closeData = useCallback(() => setDataDrawerOpen(false), []);

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

	// * The data drawer here could show additional metadata (formatted ; PDFs ; notes)
	const rawData = useMemo(() => {
		return <>
			<MenuItem icon="eye-open" onClick={showData} text="View raw metadata" />
			<DataDrawer item={item.raw} isOpen={isDataDrawerOpen} onClose={closeData} />
		</>;
	}, [closeData, item.raw, isDataDrawerOpen, showData]);

	const hotkeys = useMemo(() => {
		const { goToItemPage: pageCombo, importMetadata: metadataCombo, toggleNotes: notesCombo } = shortcutsSettings;
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

		if(metadataCombo){
			shortcutsList.push({
				...defaultProps,
				combo: metadataCombo,
				label: "Import the item's metadata to Roam",
				onKeyDown: () => importMetadata()
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

	}, [children.notes, importMetadata, inGraph, navigateToPage, shortcutsSettings, toggleNotes]);

	useHotkeys(hotkeys, {showDialogKeyCombo: "shift+Z+R"});

	return <div id="zr-item-details">
		<div zr-role="item-metadata">
			<div zr-role="item-metadata--header">
				<h5>{title}</h5>
				<span className="zr-accent-1">{authors + " (" + year + ")"}</span>
				{publication
					? <span className="zr-secondary">{publication}</span>
					: null}
				{weblink
					? <span zr-role="item-weblink" className="zr-secondary" >
						<a href={weblink.href} rel="noreferrer" target="_blank" >{weblink.title}</a>
					</span>
					: null}
			</div>
			<Metadata direction="col" label="Abstract">
				<p zr-role="item-abstract" className={["zr-text-small", Classes.RUNNING_TEXT].join(" ")}>
					{abstract}
				</p>
			</Metadata>
			<div zr-role="item-metadata--footer">
				<Metadata label="Added">
					<span className="zr-secondary">
						{makeDateFromAgo(raw.data.dateAdded)}
					</span>
					{createdByUser
						? <span>by <b>{createdByUser}</b></span>
						: null}
				</Metadata>
				{authorsFull.length > 0
					? <Metadata label="Contributors">
						{authorsFull.map((aut, i) => <Tag key={i} className="zr-text-small" intent="primary" minimal={true}>{aut}{authorsRoles[i] == "author" ? "" : " (" + authorsRoles[i] + ")"}</Tag>)}
					</Metadata>
					: null}
				{tags.length > 0
					? <Metadata label="Tags">
						<div>
							{tags.map((tag, i) => <Tag key={i} className="zr-text-small" minimal={true}>#{tag}</Tag>)}
						</div>
					</Metadata>
					: null}
			</div>
		</div>
		<div zr-role="item-actions">
			<Menu className="zr-text-small" data-in-graph={inGraph.toString()} >
				{navigator.clipboard && <CopyButtons citekey={key} item={item} />}
				<MenuDivider className="zr-divider-minimal" title="Actions" />
				{goToPageButton}
				<MenuItem icon="add" 
					labelElement={shortcutsSettings.importMetadata != false && <ShortcutSequence text={shortcutsSettings.importMetadata} />} 
					onClick={importMetadata} 
					text="Import metadata" />
				{children.notes.length > 0 && <MenuItem icon="chat" onClick={importNotes} text="Import notes" />}
				<MenuItem href={zotero.local} icon="application" rel="noreferrer" target="_blank" text="Open in Zotero" />
				<MenuItem href={zotero.web} icon="cloud" rel="noreferrer" target="_blank" text="Open in Zotero (web)" />
				{rawData}
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
