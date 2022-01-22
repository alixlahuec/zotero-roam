import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import {  Classes, Menu, MenuDivider, MenuItem, Overlay } from "@blueprintjs/core";

import { useQuery_Items } from "../../../queries";
import { importItemMetadata } from "../../../roam";
import { categorizeLibraryItems, formatItemReference, getLocalLink, getWebLink, parseDOI } from "../../../utils";
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

					let pdfs = lib.pdfs.filter(p => p.library.type + "s/" + p.library.id == location && p.data.parentItem == item.data.key);
					let notes = lib.notes.filter(n => n.library.type + "s/" + n.library.id == location && n.data.parentItem == item.data.key);

					return [
						"@" + item.key,
						{
							citation: formatItemReference(item, "inline") || "@" + item.key,
							data: {
								children: {
									pdfs,
									notes
								},
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
		},
		notifyOnChangeProps: ["data"] 
	});
	const data = itemQueries.map(q => q.data || []).flat(1);
    
	return new Map(data);
};

const CitekeyContextMenu = React.memo(function CitekeyContextMenu(props) {
	const { coords, isOpen, itemsMap, metadataSettings, onClose, target } = props;

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
				document.querySelector("body > .bp3-context-menu+.bp3-portal").style.display = "none";
			} catch(e){
				// Do nothing
			}
		}, 100);
	}, []);

	const importMetadata = useCallback(() => {
		let { pdfs = [], notes = [] } = itemData.children;
		importItemMetadata({item: itemData.raw, pdfs, notes }, pageUID, metadataSettings);
	}, [itemData.raw, itemData.children, metadataSettings, pageUID]);

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
						onClick={() => console.log(notes)}
					/>
				</>
			);
		}
	}, [itemData.children]);

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
	coords: PropTypes.shape({
		left: PropTypes.number,
		top: PropTypes.number
	}),
	isOpen: PropTypes.bool,
	itemsMap: PropTypes.instanceOf(Map),
	metadataSettings: PropTypes.object,
	onClose: PropTypes.func,
	portalId: PropTypes.string,
	target: PropTypes.node
};

const InlineCitekeys = React.memo(function InlineCitekeys(props) {
	const { dataRequests, metadataSettings, portalId, renderInline } = props;
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
					if(renderInline == true){
						linkElement.addEventListener("contextmenu", openContextMenu);
					}
				} else {
					linkElement.textContent = citekey;
					if(renderInline == true){
						linkElement.removeEventListener("contextmenu", openContextMenu);
					}
				}
			}
		}
	}, [itemsMap, renderInline, openContextMenu]);

	const cleanupCitekeyRefs = useCallback(() => {
		let refCitekeys = document.querySelectorAll("span[data-link-title^='@'][data-in-library]");
		refCitekeys.forEach(ck => { 
			ck.removeAttribute("data-in-library");
			let linkElement = ck.getElementsByClassName("rm-page-ref")[0];
			linkElement.textContent = ck.getAttribute("data-link-title");
			if(renderInline == true){
				linkElement.removeEventListener("contextmenu", openContextMenu);   
			}
		});
	}, [renderInline, openContextMenu]);

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
	}, [renderInline, renderCitekeyRefs, cleanupCitekeyRefs]);

	return (
		createPortal(
			<CitekeyContextMenu 
				coords={contextMenuCoordinates} 
				isOpen={isContextMenuOpen} 
				itemsMap={itemsMap}
				metadataSettings={metadataSettings}
				onClose={closeContextMenu}
				target={contextMenuTarget} />, 
			document.getElementById(portalId))
	);
});
InlineCitekeys.propTypes = {
	dataRequests: PropTypes.arrayOf(PropTypes.object),
	metadataSettings: PropTypes.object,
	portalId: PropTypes.string,
	renderInline: PropTypes.bool,
};

export default InlineCitekeys;
