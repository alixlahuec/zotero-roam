import React, { useCallback, useContext, useMemo } from "react";
import { arrayOf, func, object, oneOf, string } from "prop-types";
import { Button, Menu, MenuDivider, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import { importItemMetadata, openInSidebarByUID, openPageByUID } from "../../roam";
import { getLocalLink, getWebLink } from "../../utils";
import { UserSettings } from "../App";
import { useRoamCitekeys } from "../RoamCitekeysContext";

import * as customPropTypes from "../../propTypes";
import "./index.css";

const popoverMenuProps = {
	autoFocus: true,
	className: "zr-library-item-popover",
	interactionKind: "hover",
	lazy: true,
	placement: "right-start",
	popoverClassName: "zr-popover"
};

const CitekeyPopover = React.memo(function CitekeyPopover(props) {
	const { closeDialog, inGraph, item, notes = [], pdfs = [] } = props;
	const { metadata: metadataSettings } = useContext(UserSettings);
	const [, updateRoamCitekeys] = useRoamCitekeys();

	const handleClose = useCallback(() => {
		if(closeDialog){
			closeDialog();
		}
	}, [closeDialog]);

	const buttonProps = useMemo(() => {
		return inGraph
			? {className: "zr-text-small", intent: "success", onClick: () => openPageByUID(inGraph)}
			: {className: ["zr-text-small", "zr-auxiliary"].join(" ")};
	}, [inGraph]);

	const zoteroLinks = useMemo(() => {
		return (
			<>
				<MenuItem 
					icon="application"
					text="Open in Zotero (app)"
					href={getLocalLink(item, {format: "target"})} 
					target="_blank" />
				<MenuItem 
					icon="cloud"
					text="Open in Zotero (web)"
					href={getWebLink(item, {format: "target"})} 
					target="_blank" />
			</>
		);
	}, [item]);

	const importMetadata = useCallback(async() => {
		let outcome = await importItemMetadata({ item, pdfs, notes}, inGraph, metadataSettings);
		if(outcome.success && outcome.page.new){
			updateRoamCitekeys();
		}
		return outcome;
	}, [inGraph, item, metadataSettings, pdfs, notes, updateRoamCitekeys]);

	const importMetadataAndOpen = useCallback(async() => {
		let { success, args: { uid }} = await importMetadata();
		if(success){
			openInSidebarByUID(uid);
		}
	}, [importMetadata]);

	const navigateToPage = useCallback(() => {
		if(inGraph != false){
			openPageByUID(inGraph);
			handleClose();
		}
	}, [handleClose, inGraph]);

	const openPageInSidebar = useCallback(() => openInSidebarByUID(inGraph), [inGraph]);

	const pdfChildren = useMemo(() => {
		if(pdfs.length > 0){
			let libLoc = item.library.type == "group" ? ("groups/" + item.library.id) : "library";
			return (
				<>
					<MenuDivider title="PDF Attachments" />
					{pdfs.map((p,i) => {
						let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(p.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${p.data.key}` : p.data.url;
						return <MenuItem key={i} 
							href={pdfHref} 
							icon="paperclip"
							rel="noreferrer" 
							target="_blank"
							text={p.data.filename || p.data.title} />;
					})}
				</>
			);
		} else {
			return null;
		}
	}, [item.library, pdfs]);

	const actionsMenu = useMemo(() => {
		if(!inGraph){
			return (
				<Menu className="zr-text-small">
					<MenuItem icon="add" text="Import metadata" onClick={importMetadata} />
					<MenuItem icon="inheritance" text="Import & open in sidebar" onClick={importMetadataAndOpen} />
					<MenuDivider />
					{zoteroLinks}
				</Menu>
			);
		} else {
			return (
				<Menu className="zr-text-small">
					<MenuItem 
						icon="arrow-right" 
						text="Go to Roam page"
						onClick={navigateToPage} />
					<MenuItem 
						icon="inheritance" 
						text="Open in sidebar"
						onClick={openPageInSidebar} />
					<MenuDivider />
					{zoteroLinks}
					{pdfChildren}
				</Menu>
			);
		}
	}, [importMetadata, importMetadataAndOpen, inGraph, navigateToPage, openPageInSidebar, pdfChildren, zoteroLinks]);

	return (
		<Popover2 {...popoverMenuProps} content={actionsMenu}>
			<Button text={"@" + item.key} rightIcon="chevron-right" minimal={true} small={true} {...buttonProps} />
		</Popover2>
	);
});
CitekeyPopover.propTypes = {
	closeDialog: func,
	inGraph: oneOf(string, false),
	item: customPropTypes.zoteroItemType,
	notes: arrayOf(object),
	pdfs: arrayOf(object)
};

export default CitekeyPopover;
