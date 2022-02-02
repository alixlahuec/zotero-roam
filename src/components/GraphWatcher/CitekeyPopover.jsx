import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Button, Menu, MenuDivider, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import { importItemMetadata, openInSidebarByUID, openPageByUID } from "../../roam";
import { getLocalLink, getWebLink } from "../../utils";

const CitekeyPopover = React.memo(function CitekeyPopover(props) {
	const { closeDialog, inGraph, item, metadataSettings, notes = [], pdfs = [], updateRoamCitekeys } = props;

	const handleClose = useCallback(() => {
		if(closeDialog){
			closeDialog();
		}
	}, [closeDialog]);

	const popoverMenuProps = useMemo(() => {
		return {
			autoFocus: true,
			className: "zr-library-item-popover",
			interactionKind: "hover",
			lazy: true,
			placement: "right-start",
			popoverClassName: "zr-popover"
		};
	}, []);

	const buttonProps = useMemo(() => {
		return inGraph
			? {intent: "success", onClick: () => openPageByUID(inGraph), className: "zr-text-small"}
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

	const openPageInSidebar = useCallback(() => {
		openInSidebarByUID(inGraph);
	}, [inGraph]);

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
				</Menu>
			);
		}
	}, [importMetadata, importMetadataAndOpen, inGraph, navigateToPage, openPageInSidebar, zoteroLinks]);

	return (
		<Popover2 {...popoverMenuProps} content={actionsMenu}>
			<Button text={"@" + item.key} rightIcon="chevron-right" minimal={true} small={true} {...buttonProps} />
		</Popover2>
	);
});
CitekeyPopover.propTypes = {
	closeDialog: PropTypes.func,
	inGraph: PropTypes.oneOf(PropTypes.string, false),
	item: PropTypes.object,
	metadataSettings: PropTypes.object,
	notes: PropTypes.arrayOf(PropTypes.object),
	pdfs: PropTypes.arrayOf(PropTypes.object),
	updateRoamCitekeys: PropTypes.func
};

export default CitekeyPopover;
