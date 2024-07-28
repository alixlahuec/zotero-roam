import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {  Classes, Menu, MenuDivider, MenuItem, Overlay } from "@blueprintjs/core";

import { useExtensionContext } from "Components/App";
import NotesDrawer from "Components/NotesDrawer";
import { useAnnotationsSettings, useMetadataSettings, useNotesSettings, useOtherSettings, useRequestsSettings, useTypemapSettings } from "Components/UserSettings";

import { useItems } from "@clients/zotero";
import { useBool } from "@hooks";
import { Queries } from "@services/react-query";
import { importItemMetadata } from "@services/roam";

import { categorizeLibraryItems, formatItemReference, getLocalLink, getWebLink, identifyChildren, parseDOI } from "../../../utils";

import { DataRequest } from "Types/extension";
import { ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "Types/transforms";
import "./_index.sass";


export const WATCHER_DELAY = 1000;

type Citekey = string;
type Item = {
	citation: string,
	data: {
		children: {
			pdfs: ZItemAttachment[],
			notes: (ZItemAnnotation | ZItemNote)[]
		},
		location: string,
		raw: ZItemTop,
		weblink: false | { href: string, title: string },
		zotero: {
			local: string,
			web: string
		}
	}
};
type ItemsMap = Map<Citekey, Item>


/** Custom hook to retrieve library items and return a Map with their data & formatted citation */
const useGetItems = (reqs: DataRequest[]): ItemsMap => {
	const select = useCallback((datastore: Queries.Data.Items) => {
		if (datastore.data) {
			const lib = categorizeLibraryItems(datastore.data);

			return lib.items.map<[Citekey, Item]>(item => {
				const hasURL = item.data.url;
				const hasDOI = parseDOI(item.data.DOI);
				const weblink = hasURL
					? { href: hasURL, title: hasURL }
					: hasDOI
						? { href: "https://doi/org/" + hasDOI, title: hasDOI }
						: false;
				const location = item.library.type + "s/" + item.library.id;

				const children = identifyChildren(item.data.key, location, { pdfs: lib.pdfs, notes: lib.notes });

				return [
					"@" + item.key,
					{
						citation: formatItemReference(item, "inline") || "@" + item.key,
						data: {
							children,
							location,
							raw: item,
							weblink,
							zotero: {
								local: getLocalLink(item, { format: "target" }),
								web: getWebLink(item, { format: "target" })
							}
						}
					}
				];
			});
		} else {
			return [];
		}
	}, []);

	const itemQueries = useItems(reqs, { 
		notifyOnChangeProps: ["data"],
		select
	});

	const data = useMemo(() => itemQueries.map(q => q.data || []).flat(1), [itemQueries]);
    
	return new Map(data);
};


type CitekeyContextMenuProps = {
	coords: {
		left: number,
		top: number
	},
	isOpen: boolean,
	itemsMap: ItemsMap,
	onClose: () => void,
	target: HTMLElement | null
};

const CitekeyContextMenu = memo<CitekeyContextMenuProps>(function CitekeyContextMenu(props) {
	const { coords, isOpen, itemsMap, onClose, target } = props;
	const [annotationsSettings] = useAnnotationsSettings();
	const [metadataSettings] = useMetadataSettings();
	const [notesSettings] = useNotesSettings();
	const [typemap] = useTypemapSettings();
	const [isNotesDrawerOpen, { on: showNotesDrawer, off: closeDrawer }] = useBool(false);

	const citekey = target?.parentElement?.dataset.linkTitle;
	const pageUID = target?.parentElement?.dataset.linkUid || false;

	const itemData = useMemo<Item["data"] | null>(() => {
		if(citekey){
			return itemsMap.get(citekey)!.data;
		} else {
			return null;
		}
	}, [citekey, itemsMap]);

	const onOpening = useCallback(() => {
		setTimeout(() => {
			try{
				// Hide default Roam context menu
				document.querySelector<HTMLElement>("body > .bp3-context-menu+.bp3-portal")!.style.display = "none";
			} catch(e){
				// Do nothing
			}
		}, 100);
	}, []);

	const importMetadata = useCallback(() => {
		if (itemData) {
			const { pdfs = [], notes = [] } = itemData.children;
			importItemMetadata({ item: itemData.raw, pdfs, notes }, pageUID, metadataSettings, typemap, notesSettings, annotationsSettings);
			onClose();	
		}
	}, [annotationsSettings, itemData, metadataSettings, notesSettings, onClose, pageUID, typemap]);

	const closeNotesDrawer = useCallback(() => {
		closeDrawer();
		onClose();
	}, [onClose, closeDrawer]);

	const pdfChildren = useMemo(() => {
		if (!itemData || itemData.children.pdfs.length == 0) {
			return null;
		} else {
			const libLoc = itemData.location.startsWith("groups/") ? itemData.location : "library";
			
			return (
				<>
					<MenuDivider title="PDF Attachments" />
					{itemData.children.pdfs.map((p,i) => {
						const pdfHref = (["linked_file", "imported_file", "imported_url"].includes(p.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${p.data.key}` : p.data.url;
						return <MenuItem key={i} className="zr-context-menu--option" 
							href={pdfHref} 
							icon="paperclip"
							rel="noreferrer" 
							target="_blank"
							text={p.data.filename || p.data.title} />;
					})}
				</>
			);
		}
	}, [itemData]);

	const notesChildren = useMemo(() => {
		if(!itemData || itemData.children.notes.length == 0){
			return null;
		} else {
			return (
				<>
					<MenuDivider />
					<MenuItem className="zr-context-menu--option"
						icon="comment"
						text="Show notes"
						onClick={showNotesDrawer}
						shouldDismissPopover={false}
					/>
					<NotesDrawer isOpen={isNotesDrawerOpen} notes={itemData.children.notes} onClose={closeNotesDrawer} />
				</>
			);
		}
	}, [closeNotesDrawer, isNotesDrawerOpen, itemData, showNotesDrawer]);

	return (
		<Overlay
			isOpen={isOpen}
			hasBackdrop={false}
			lazy={false}
			onClose={onClose}
			onOpening={onOpening}
			usePortal={false}>
			<div className={["zr-context-menu--wrapper", Classes.POPOVER].join(" ")} style={coords}>
				<Menu className="zr-context-menu">
					<MenuItem className="zr-context-menu--option" 
						icon="add" 
						text="Import metadata"
						intent="primary" 
						onClick={importMetadata} />
					<MenuDivider />
					{itemData &&
						<MenuItem className="zr-context-menu-option"
							icon="application"
							text="Open in Zotero"
							href={itemData.zotero.local}
						/>}
					{itemData &&
						<MenuItem className="zr-context-menu-option"
							icon="cloud"
							text="Open in Zotero (web)"
							href={itemData.zotero.web}
						/>}
					{pdfChildren}
					{notesChildren}
				</Menu>
			</div>
		</Overlay>
	);
});


const InlineCitekeys = memo(function InlineCitekeys() {
	const { portalId } = useExtensionContext();
	const [{ dataRequests }] = useRequestsSettings();
	const [{ render_inline }] = useOtherSettings();

	const [isContextMenuOpen, setContextMenuOpen] = useState(false);
	const [contextMenuCoordinates, setContextMenuCoordinates] = useState({ left: 0, top: 0 });
	const [contextMenuTarget, setContextMenuTarget] = useState<HTMLElement | null>(null);

	const itemsMap = useGetItems(dataRequests);
    
	const openContextMenu = useCallback((e: MouseEvent) => {
		e.preventDefault();
		const { pageX: left, pageY: top, target } = e;
		setContextMenuCoordinates({ left, top });
		setContextMenuTarget(target as HTMLElement);
		setContextMenuOpen(true);
	}, []);

	const closeContextMenu = useCallback(() => {
		setContextMenuOpen(false);
		setContextMenuTarget(null);
	}, []);

	const renderCitekeyRefs = useCallback(() => {
		const refCitekeys = document.querySelectorAll("span[data-link-title^='@']");

		for(let i=0;i<refCitekeys.length;i++){
			const refCitekeyElement = refCitekeys[i];
			const linkElement = refCitekeyElement.getElementsByClassName("rm-page-ref")[0];
			const citekey = refCitekeyElement.getAttribute("data-link-title")!;

			const prev_status = refCitekeyElement.getAttribute("data-in-library");
			const current_status = itemsMap.has(citekey).toString();

			if(prev_status != null && prev_status == current_status){
				// If the item's status has not changed, move on
				continue;
			} else {
				refCitekeyElement.setAttribute("data-in-library", current_status);

				if(prev_status == null && current_status == "false"){
					continue;
				} else if(current_status == "true"){
					if(render_inline == true){
						linkElement.textContent = itemsMap.get(citekey)!.citation;
					}
					linkElement.addEventListener("contextmenu", openContextMenu);
				} else {
					linkElement.textContent = citekey;
					linkElement.removeEventListener("contextmenu", openContextMenu);
				}
			}
		}
	}, [itemsMap, render_inline, openContextMenu]);

	const cleanupCitekeyRefs = useCallback(() => {
		const refCitekeys = document.querySelectorAll("span[data-link-title^='@'][data-in-library]");
		refCitekeys.forEach(ck => { 
			ck.removeAttribute("data-in-library");
			const linkElement = ck.getElementsByClassName("rm-page-ref")[0];
			linkElement.textContent = ck.getAttribute("data-link-title");
			linkElement.removeEventListener("contextmenu", openContextMenu);   
		});
	}, [openContextMenu]);

	useEffect(() => {
		const watcher = setInterval(
			() => {
				renderCitekeyRefs();
			}, WATCHER_DELAY
		);
		return function cleanup() {
			clearInterval(watcher);
			cleanupCitekeyRefs();
		};
	}, [renderCitekeyRefs, cleanupCitekeyRefs]);

	useEffect(() => {
		const refCitekeys = document.querySelectorAll("span[data-link-title^='@'][data-in-library]");

		refCitekeys.forEach(ck => {
			const linkElement = ck.getElementsByClassName("rm-page-ref")[0];
			const citekey = ck.getAttribute("data-link-title")!;
			const inLibrary = ck.getAttribute("data-in-library") == "true";
			linkElement.textContent = inLibrary
				? itemsMap.get(citekey)!.citation
				: citekey;
		});
	}, [render_inline, itemsMap]);

	return (
		createPortal(
			<CitekeyContextMenu 
				coords={contextMenuCoordinates} 
				isOpen={isContextMenuOpen} 
				itemsMap={itemsMap}
				onClose={closeContextMenu}
				target={contextMenuTarget} />, 
			document.getElementById(portalId)!)
	);
});

export default InlineCitekeys;
export { useGetItems, CitekeyContextMenu };