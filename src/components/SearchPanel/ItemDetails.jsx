import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Classes, Divider, Menu, MenuItem, Tag } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import ButtonLink from "../ButtonLink";
import { importItemMetadata, openPageByUID } from "../../roam";
import { copyToClipboard } from "../../utils";
import { formatItemReferenceForCopy } from "./utils";
import * as customPropTypes from "../../propTypes";

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
	citekey: PropTypes.string,
	format: PropTypes.oneOf(["citation", "citekey", "page-reference", "tag"]),
	item: PropTypes.object,
	text: PropTypes.string,
};

function CopyButtons(props){
	const { citekey, defaultCopyFormat, inGraph, item } = props;

	const defaultCopyText = useMemo(() => {
		return formatItemReferenceForCopy(item, defaultCopyFormat);
	}, [defaultCopyFormat, item]);

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
				onClick={() => copyToClipboard(defaultCopyText)} />
			<Popover2 interactionKind="hover" placement="right-start" popoverClassName="zr-popover" content={optionsMenu} >
				<Button icon="caret-right" intent={inGraph ? "success" : "warning"} />
			</Popover2>
		</ButtonGroup>
	);
}
CopyButtons.propTypes = {
	defaultCopyFormat: PropTypes.oneOf(["citation", "citekey", "page-reference", "raw", "tag", PropTypes.func]),
	citekey: PropTypes.string,
	inGraph: PropTypes.bool,
	item: PropTypes.object
};

function ItemDetails(props) {
	const { closeDialog, defaultCopyFormat, item, metadataSettings } = props;
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

	const importMetadata = useCallback(async() => {
		let { pdfs = [], notes = [] } = children;
		return await importItemMetadata({item: item.raw, pdfs, notes }, inGraph, metadataSettings);
	}, [children, inGraph, item.raw, metadataSettings]);
	
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
					? <CopyButtons citekey={key} inGraph={inGraph != false} item={props.item} defaultCopyFormat={defaultCopyFormat} />
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
							icon="add"
							onClick={importMetadata} />
					</ButtonGroup>
					<Divider />
					<ButtonGroup minimal={true} alignText="left" vertical={true} >
						<ButtonLink href={zotero.local} icon="application" text="Open in Zotero" />
						<ButtonLink href={zotero.web} icon="cloud" text="Open in Zotero (web)" />
					</ButtonGroup>
				</div>
				{pdfs}
				{notes}
			</div>
		</div>
	</div>;
}
ItemDetails.propTypes = {
	closeDialog: PropTypes.func,
	defaultCopyFormat: PropTypes.oneOf(["citation", "citekey", "page-reference", "raw", "tag", PropTypes.func]),
	item: customPropTypes.cleanLibraryItemType,
	metadataSettings: PropTypes.object
};

export default ItemDetails;
