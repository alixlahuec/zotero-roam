import { arrayOf, func, oneOf, oneOfType, string } from "prop-types";
import { memo, useCallback, useMemo } from "react";

import { Button, Menu, MenuDivider, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import { useAnnotationsSettings } from "../UserSettings/Annotations";
import { useMetadataSettings } from "../UserSettings/Metadata";
import { useNotesSettings } from "../UserSettings/Notes";
import { useRoamCitekeys } from "../RoamCitekeysContext";
import { useTypemapSettings } from "../UserSettings/Typemap";

import { getLocalLink, getWebLink } from "../../utils";
import { importItemMetadata, openInSidebarByUID, openPageByUID } from "Roam";

import * as customPropTypes from "../../propTypes";
import { CustomClasses } from "../../constants";

import "./index.css";


const popoverProps = {
	autoFocus: true,
	boundary: "window",
	className: "zr-library-item-popover",
	interactionKind: "hover",
	lazy: true,
	placement: "right-start",
	popoverClassName: CustomClasses.POPOVER
};

const CitekeyPopover = memo(function CitekeyPopover(props) {
	const { closeDialog, inGraph, item, notes = [], pdfs = [] } = props;
	const [annotationsSettings] = useAnnotationsSettings();
	const [metadataSettings] = useMetadataSettings();
	const [notesSettings] = useNotesSettings();
	const [typemap] = useTypemapSettings();
	const [, updateRoamCitekeys] = useRoamCitekeys();

	const handleClose = useCallback(() => {
		if(closeDialog){
			closeDialog();
		}
	}, [closeDialog]);

	const buttonProps = useMemo(() => {
		return inGraph
			? { className: CustomClasses.TEXT_SMALL, onClick: () => openPageByUID(inGraph) }
			: { className: [CustomClasses.TEXT_SMALL, CustomClasses.TEXT_AUXILIARY].join(" ") };
	}, [inGraph]);

	const zoteroLinks = useMemo(() => {
		return (
			<>
				<MenuItem 
					icon="application"
					text="Open in Zotero (app)"
					href={getLocalLink(item, { format: "target" })} 
					target="_blank" />
				<MenuItem 
					icon="cloud"
					text="Open in Zotero (web)"
					href={getWebLink(item, { format: "target" })} 
					target="_blank" />
			</>
		);
	}, [item]);

	const importMetadata = useCallback(async() => {
		const outcome = await importItemMetadata({ item, pdfs, notes }, inGraph, metadataSettings, typemap, notesSettings, annotationsSettings);
		if(outcome.success && outcome.page.new){
			updateRoamCitekeys();
		}
		return outcome;
	}, [annotationsSettings, inGraph, item, metadataSettings, pdfs, notes, notesSettings, typemap, updateRoamCitekeys]);

	const importMetadataAndOpen = useCallback(async() => {
		const { success, args: { uid } } = await importMetadata();
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
			const libLoc = item.library.type == "group" ? ("groups/" + item.library.id) : "library";
			return (
				<>
					<MenuDivider title="PDF Attachments" />
					{pdfs.map((p,i) => {
						const pdfHref = (["linked_file", "imported_file", "imported_url"].includes(p.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${p.data.key}` : p.data.url;
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
				<Menu className={CustomClasses.TEXT_SMALL}>
					<MenuItem icon="add" text="Import metadata" onClick={importMetadata} />
					<MenuItem icon="inheritance" text="Import & open in sidebar" onClick={importMetadataAndOpen} />
					<MenuDivider />
					{zoteroLinks}
					{pdfChildren}
				</Menu>
			);
		} else {
			return (
				<Menu className={CustomClasses.TEXT_SMALL}>
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
		<Popover2 {...popoverProps} content={actionsMenu}>
			<Button intent={(inGraph != false) ? "success" : null} minimal={true} rightIcon="chevron-right" small={true} text={"@" + item.key} {...buttonProps} />
		</Popover2>
	);
});
CitekeyPopover.propTypes = {
	closeDialog: func,
	inGraph: oneOfType([string, oneOf([false])]),
	item: customPropTypes.zoteroItemType,
	notes: arrayOf(customPropTypes.zoteroItemType),
	pdfs: arrayOf(customPropTypes.zoteroItemType)
};

export default CitekeyPopover;
