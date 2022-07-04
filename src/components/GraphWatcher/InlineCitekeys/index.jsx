import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { bool, func, instanceOf, number, object, shape } from "prop-types";
import {  Classes, Menu, MenuDivider, MenuItem, Overlay } from "@blueprintjs/core";

import NotesDrawer from "../../NotesDrawer";

import { useQuery_Items } from "../../../api/queries";
import { importItemMetadata } from "../../../roam";
import { categorizeLibraryItems, formatItemReference, getLocalLink, getWebLink, identifyChildren, parseDOI } from "../../../utils";

import { ExtensionContext, UserSettings } from "../../App";
import useBool from "../../../hooks/useBool";
import "./index.css";

/** Custom hook to retrieve library items and return a Map with their data & formatted citation
 * @param {Object[]} reqs - The data requests to use to retrieve items
 * @returns {Map<String,
 * {citation: String, 
 * data: {
 * children: {pdfs: Array, notes: Array}, 
 * location: String,
 * raw: Object,
 * weblink: Object|Boolean, 
 * zotero: {local: String, web: String}}}>} The map of current library items
 */
const useGetItems = (reqs) => {
	const itemQueries = useQuery_Items(reqs, { 
		notifyOnChangeProps: ["data"],
		select: (datastore) => {
			if(datastore.data){
				let lib = categorizeLibraryItems(datastore.data);

				return lib.items.map(item => {
					let hasURL = item.data.url;
					let hasDOI = parseDOI(item.data.DOI);
					let weblink = hasURL
						? { href: hasURL, title: hasURL }
						: hasDOI
							? { href: "https://doi/org/" + hasDOI, title: hasDOI}
							: false;
					let location = item.library.type + "s/" + item.library.id;

					let children = identifyChildren(item.data.key, location, { pdfs: lib.pdfs, notes: lib.notes });

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
									local: getLocalLink(item, {format: "target"}),
									web: getWebLink(item, {format: "target"})
								}
							}
						}
					];
				});
			} else {
				return [];
			}
		} 
	});
	const data = itemQueries.map(q => q.data || []).flat(1);
    
	return new Map(data);
};

const CitekeyContextMenu = React.memo(function CitekeyContextMenu(props) {
	const { coords, isOpen, itemsMap, onClose, target } = props;
	const { annotations: annotationsSettings, metadata: metadataSettings, notes: notesSettings, typemap } = useContext(UserSettings);
	const [isNotesDrawerOpen, { on: showNotesDrawer, off: closeDrawer }] = useBool(false);

	const citekey = target?.parentElement.dataset.linkTitle;
	const pageUID = target?.parentElement.dataset.linkUid;

	const itemData = useMemo(() => {
		if(citekey){
			return itemsMap.get(citekey).data;
		} else {
			return {};
		}
	}, [citekey, itemsMap]);

	const onOpening = useCallback(() => {
		setTimeout(() => {
			try{
				// Hide default Roam context menu
				document.querySelector("body > .bp4-context-menu+.bp4-portal").style.display = "none";
			} catch(e){
				// Do nothing
			}
		}, 100);
	}, []);

	const importMetadata = useCallback(() => {
		let { pdfs = [], notes = [] } = itemData.children;
		importItemMetadata({item: itemData.raw, pdfs, notes }, pageUID, metadataSettings, typemap, notesSettings, annotationsSettings);
		onClose();
	}, [annotationsSettings, itemData.raw, itemData.children, metadataSettings, notesSettings, onClose, pageUID, typemap]);

	const closeNotesDrawer = useCallback(() => {
		closeDrawer();
		onClose();
	}, [onClose, closeDrawer]);

	const pdfChildren = useMemo(() => {
		if(!(itemData?.children?.pdfs?.length > 0)){
			return null;
		} else {
			let { pdfs = [] } = itemData.children;
			let libLoc = itemData.location.startsWith("groups/") ? itemData.location : "library";
			
			return (
				<>
					<MenuDivider title="PDF Attachments" />
					{pdfs.map((p,i) => {
						let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(p.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${p.data.key}` : p.data.url;
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
	}, [itemData.children, itemData.location]);

	const notesChildren = useMemo(() => {
		if(!(itemData?.children?.notes?.length > 0)){
			return null;
		} else {
			let { notes = [] } = itemData.children;

			return (
				<>
					<MenuDivider />
					<MenuItem className="zr-context-menu--option"
						icon="comment"
						text="Show notes"
						onClick={showNotesDrawer}
						shouldDismissPopover={false}
					/>
					<NotesDrawer isOpen={isNotesDrawerOpen} notes={notes} onClose={closeNotesDrawer} />
				</>
			);
		}
	}, [closeNotesDrawer, isNotesDrawerOpen, itemData.children, showNotesDrawer]);

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
					<MenuItem className="zr-context-menu-option" 
						icon="application"
						text="Open in Zotero"
						href={itemData.zotero?.local}
					/>
					<MenuItem className="zr-context-menu-option"
						icon="cloud"
						text="Open in Zotero (web)"
						href={itemData.zotero?.web}
					/>
					{pdfChildren}
					{notesChildren}
				</Menu>
			</div>
		</Overlay>
	);
});
CitekeyContextMenu.propTypes = {
	coords: shape({
		left: number,
		top: number
	}),
	isOpen: bool,
	itemsMap: instanceOf(Map),
	onClose: func,
	target: object
};

/* istanbul ignore next */
const InlineCitekeys = React.memo(function InlineCitekeys() {
	const { dataRequests, portalId } = useContext(ExtensionContext);
	const { render_inline } = useContext(UserSettings);

	const [isContextMenuOpen, setContextMenuOpen] = useState(false);
	const [contextMenuCoordinates, setContextMenuCoordinates] = useState({left: 0, top:0});
	const [contextMenuTarget, setContextMenuTarget] = useState(null);

	const itemsMap = useGetItems(dataRequests);
    
	const openContextMenu = useCallback((e) => {
		e.preventDefault();
		const { pageX: left, pageY: top, target} = e;
		setContextMenuCoordinates({left, top});
		setContextMenuTarget(target);
		setContextMenuOpen(true);
	}, []);

	const closeContextMenu = useCallback(() => {
		setContextMenuOpen(false);
		setContextMenuTarget(null);
	}, []);

	const renderCitekeyRefs = useCallback(() => {
		let refCitekeys = document.querySelectorAll("span[data-link-title^='@']");

		for(let i=0;i<refCitekeys.length;i++){
			let refCitekeyElement = refCitekeys[i];
			let linkElement = refCitekeyElement.getElementsByClassName("rm-page-ref")[0];
			let citekey = refCitekeyElement.getAttribute("data-link-title");

			let prev_status = refCitekeyElement.getAttribute("data-in-library");
			let current_status = itemsMap.has(citekey).toString();

			if(prev_status != null && prev_status == current_status){
				// If the item's status has not changed, move on
				continue;
			} else {
				refCitekeyElement.setAttribute("data-in-library", current_status);

				if(prev_status == null && current_status == "false"){
					continue;
				} else if(current_status == "true"){
					linkElement.textContent = itemsMap.get(citekey).citation;
					if(render_inline == true){
						linkElement.addEventListener("contextmenu", openContextMenu);
					}
				} else {
					linkElement.textContent = citekey;
					if(render_inline == true){
						linkElement.removeEventListener("contextmenu", openContextMenu);
					}
				}
			}
		}
	}, [itemsMap, render_inline, openContextMenu]);

	const cleanupCitekeyRefs = useCallback(() => {
		let refCitekeys = document.querySelectorAll("span[data-link-title^='@'][data-in-library]");
		refCitekeys.forEach(ck => { 
			ck.removeAttribute("data-in-library");
			let linkElement = ck.getElementsByClassName("rm-page-ref")[0];
			linkElement.textContent = ck.getAttribute("data-link-title");
			if(render_inline == true){
				linkElement.removeEventListener("contextmenu", openContextMenu);   
			}
		});
	}, [render_inline, openContextMenu]);

	useEffect(() => {		
		const watcher = setInterval(
			() => {
				renderCitekeyRefs();
			}, 1000
		);
		return function cleanup() {
			clearInterval(watcher);
			cleanupCitekeyRefs();
		};
	}, [renderCitekeyRefs, cleanupCitekeyRefs]);

	return (
		createPortal(
			<CitekeyContextMenu 
				coords={contextMenuCoordinates} 
				isOpen={isContextMenuOpen} 
				itemsMap={itemsMap}
				onClose={closeContextMenu}
				target={contextMenuTarget} />, 
			document.getElementById(portalId))
	);
});

export default InlineCitekeys;
export { useGetItems, CitekeyContextMenu };