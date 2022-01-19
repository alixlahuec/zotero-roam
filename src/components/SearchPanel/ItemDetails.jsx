import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Classes, Icon, Menu, MenuItem, Tag } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import ButtonLink from "../ButtonLink";
import { openPageByUID } from "../../roam";
import { copyToClipboard } from "../../utils";
import { formatItemReferenceForCopy } from "./utils";

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
  
	return <MenuItem onClick={formatCitekey} text={text} />;
}
CopyOption.propTypes = {
	citekey: PropTypes.string,
	format: PropTypes.oneOf(["citation", "citekey", "page-reference", "tag"]),
	item: PropTypes.object,
	text: PropTypes.string,
};

function CopyButtons(props){
	const { citekey, defaultCopyFormat, item } = props;

	const defaultCopyText = useMemo(() => {
		return formatItemReferenceForCopy(item, defaultCopyFormat);
	}, [defaultCopyFormat, item]);

	const optionsMenu = useMemo(() => {
		let options = [
			{ format: "citekey", text: "Copy @citekey" },
			{ format: "tag", text: "Copy #@citekey" },
			{ format: "page-reference", text: "Copy [[@citekey]]" },
			{ format: "citation", text: "Copy [Citation]([[@]])" }
		].filter(op => op.format != defaultCopyFormat);
		return (
			<Menu className="zr-text-small">
				{options.map(op => <CopyOption key={op.format} citekey={citekey} item={item} {...op} />)}
			</Menu>
		);
	}, [citekey, defaultCopyFormat, item]);

	return (
		<ButtonGroup className="copy-buttons" fill={true} minimal={true} >
			<Button icon="clipboard" text={"Copy " + defaultCopyText} onClick={() => copyToClipboard(defaultCopyText)} />
			<Popover2 interactionKind="hover" content={optionsMenu} >
				<Button icon="caret-right" />
			</Popover2>
		</ButtonGroup>
	);
}
CopyButtons.propTypes = {
	defaultCopyFormat: PropTypes.oneOf(["citation", "citekey", "page-reference", "raw", "tag", PropTypes.func]),
	citekey: PropTypes.string,
	item: PropTypes.object
};

function ItemDetails(props) {
	const { defaultCopyFormat, closeDialog, item } = props;
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
	
	const navigateToPage = useCallback(() => {
		if(inGraph != false){
			openPageByUID(inGraph);
			closeDialog();
		}
	}, [closeDialog, inGraph]);

	const showNotes = useCallback(() => {
		// For testing
		console.log(children.notes);
	}, [children.notes]);

	// TODO: Write callback function that imports metadata, using item.raw as argument

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
			return (
				<ButtonGroup minimal={true} fill={true} alignText="left">
					<Button icon="comment" text="Show notes" onClick={showNotes} />
				</ButtonGroup>
			);
		}
	}, [children.notes, showNotes]);

	return <div id="zotero-roam-search-selected-item">
		<div className="selected-item-header">
			<div className="item-basic-metadata">
				<h4 className="item-title">{title}</h4>
				<span className="zotero-roam-search-item-authors zr-highlight">{authors + " (" + year + ")"}</span>
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
				<div className={Classes.FILL + " citekey-element"}>
					{inGraph
						? <Icon icon="symbol-circle" intent="success" />
						: <Icon icon="minus" intent="warning" />}
					{"@" + key}
				</div>
				{navigator.clipboard
					? <CopyButtons citekey={key} item={props.item} defaultCopyFormat={defaultCopyFormat} />
					: null}
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
					<ButtonGroup minimal={true} alignText="left" vertical={true} fill={true}>
						{ inGraph 
							? <Button text="Go to Roam page"
								className="item-go-to-page"
								icon="arrow-right"
								onClick={navigateToPage} />
							: null  
						}
						<Button text="Import item metadata"
							className="item-add-metadata"
							icon="add" />
					</ButtonGroup>
				</div>
				<ButtonGroup minimal={true} alignText="left" vertical={true} fill={true}>
					<ButtonLink href={zotero.local} icon="application" text="Open in Zotero" />
					<ButtonLink href={zotero.web} icon="cloud" text="Open in Zotero (web)" />
				</ButtonGroup>
				{pdfs}
				{notes}
			</div>
		</div>
	</div>;
}
ItemDetails.propTypes = {
	defaultCopyFormat: PropTypes.oneOf(["citation", "citekey", "page-reference", "raw", "tag", PropTypes.func]),
	closeDialog: PropTypes.func,
	item: PropTypes.shape({
		abstract: PropTypes.string,
		authors: PropTypes.string,
		authorsFull: PropTypes.arrayOf(PropTypes.string),
		authorsLastNames: PropTypes.arrayOf(PropTypes.string),
		authorsRoles: PropTypes.arrayOf(PropTypes.string),
		children: PropTypes.shape({
			pdfs: PropTypes.arrayOf(PropTypes.object),
			notes: PropTypes.arrayOf(PropTypes.object)
		}),
		inGraph: PropTypes.bool,
		itemKey: PropTypes.string,
		itemType: PropTypes.string,
		key: PropTypes.string,
		location: PropTypes.string,
		meta: PropTypes.string,
		publication: PropTypes.string,
		tags: PropTypes.array,
		tagsString: PropTypes.string,
		title: PropTypes.string,
		weblink: PropTypes.oneOfType(PropTypes.object, PropTypes.bool),
		year: PropTypes.string,
		zotero: PropTypes.shape({
			local: PropTypes.string,
			web: PropTypes.string
		}),
		"_multiField": PropTypes.string,
		raw: PropTypes.object
	})
};

export default ItemDetails;
