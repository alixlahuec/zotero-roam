import { HTMLProps, memo, useCallback, useMemo } from "react";
import { Button, ButtonProps, Intent, Menu, MenuDivider, MenuItem } from "@blueprintjs/core";
import { IPopover2SharedProps, Popover2, Popover2InteractionKind, Popover2Props } from "@blueprintjs/popover2";

import { useAnnotationsSettings, useMetadataSettings, useNotesSettings, useTypemapSettings } from "Components/UserSettings";
import { useRoamCitekeys } from "Components/RoamCitekeysContext";

import { importItemMetadata, openInSidebarByUID, openPageByUID } from "@services/roam";

import { CustomClasses } from "../../constants";
import { getLocalLink, getWebLink } from "../../utils";
import { ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "Types/transforms";
import "./_index.sass";


const popoverProps: Partial<Popover2Props> = {
	autoFocus: true,
	boundary: "window" as IPopover2SharedProps<HTMLProps<HTMLElement>>["boundary"], // TODO: Update to Popover2SharedProps<DefaultPopover2TargetHTMLProps>["boundary"] once issues with popover2 v1 are fixed
	className: "zr-library-item-popover",
	interactionKind: Popover2InteractionKind.HOVER,
	lazy: true,
	placement: "right-start",
	popoverClassName: CustomClasses.POPOVER
};

type OwnProps = {
	closeDialog?: () => void,
	inGraph: string | false,
	item: ZItemTop,
	notes: (ZItemAnnotation | ZItemNote)[],
	pdfs: ZItemAttachment[]
};

const CitekeyPopover = memo<OwnProps>(function CitekeyPopover(props) {
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

	const buttonProps = useMemo<Partial<ButtonProps>>(() => {
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

	const importMetadata = useCallback(async () => {
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

	const openPageInSidebar = useCallback(() => {
		if (inGraph != false) {
			openInSidebarByUID(inGraph);	
		}
	}, [inGraph]);

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
			<Button intent={(inGraph != false) ? Intent.SUCCESS : undefined} minimal={true} rightIcon="chevron-right" small={true} text={"@" + item.key} {...buttonProps} />
		</Popover2>
	);
});

export default CitekeyPopover;
