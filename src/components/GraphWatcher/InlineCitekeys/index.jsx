import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Classes, Menu, MenuItem, Overlay } from "@blueprintjs/core";

import { queryItems } from "../../../queries";
import { formatItemReference } from "../../../utils";
import { createPortal } from "react-dom";

/** Custom hook to retrieve library items and return a Map with their data & formatted citation
 * @param {Object[]} reqs - The data requests to use to retrieve items
 * @returns {Map<String,{citation: String, data: ZoteroItem|Object}>} The map of current library items
 */
const getItems = (reqs) => {
	const itemQueries = queryItems(reqs, { 
		select: (datastore) => {
			return datastore.data
				? datastore.data
					.filter(item => !["attachment", "note", "annotation"].includes(item.data.itemType))
					.map(item => {
						return [
							"@" + item.key, 
							{
								citation: formatItemReference(item, "inline") || "@" + item.key,
								data: item
							}
						];
					})
				: [];
		},
		notifyOnChangeProps: ["data"] 
	});
	const data = itemQueries.map(q => q.data || []).flat(1);
    
	return new Map(data);
};

const CitekeyContextMenu = React.memo(function CitekeyContextMenu(props) {
	const { coords, isOpen, itemsMap, onClose, target } = props;

	const citekey = target?.parentElement.dataset.linkTitle;
	const pageUID = target?.parentElement.dataset.linkUid;

	const item = useMemo(() => {
		if(citekey){
			return itemsMap.get(citekey).data;
		} else {
			return {};
		}
	}, [citekey, itemsMap]);

	const onOpen = useCallback(() => {
		setTimeout(() => {
			try{
				// Hide default Roam context menu
				document.querySelector("body > .bp3-context-menu+.bp3-portal").style.display = "none";
			} catch(e){
				// Do nothing
			}
		}, 160);
	}, []);

	return (
		<Overlay
			isOpen={isOpen}
			hasBackdrop={false}
			lazy={false}
			onClose={onClose}
			onOpen={onOpen}
			usePortal={false}>
			<div className={["zr-context-menu--wrapper", Classes.POPOVER].join(" ")} style={coords}>
				<Menu className="zr-context-menu">
					<MenuItem className="zr-context-menu--option" 
						icon="add" 
						text="Import metadata"
						intent="primary" 
						data-uid={pageUID} 
						data-item-type={item.data?.itemType}
						data-citekey={citekey} />
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
	onClose: PropTypes.func,
	portalId: PropTypes.string,
	target: PropTypes.node
};

const InlineCitekeys = React.memo(function InlineCitekeys(props) {
	const { dataRequests, portalId, renderInline } = props;
	const [isContextMenuOpen, setContextMenuOpen] = useState(false);
	const [contextMenuCoordinates, setContextMenuCoordinates] = useState({left: 0, top:0});
	const [contextMenuTarget, setContextMenuTarget] = useState(null);

	const itemsMap = getItems(dataRequests);
    
	const openContextMenu = useCallback((e) => {
		e.preventDefault();
		const { pageX: left, pageY: top, target} = e;
		setContextMenuCoordinates({left, top});
		setContextMenuTarget(target);
		setContextMenuOpen(true);
	}, []);

	const closeContextMenu = useCallback(() => {
		setContextMenuTarget(null);
		setContextMenuCoordinates({left: 0, top: 0});
		setContextMenuOpen(false);
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
			cleanupCitekeyRefs;
		};
	}, [renderInline, renderCitekeyRefs, cleanupCitekeyRefs]);

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
InlineCitekeys.propTypes = {
	dataRequests: PropTypes.arrayOf(PropTypes.object),
	portalId: PropTypes.string,
	renderInline: PropTypes.bool,
};

export default InlineCitekeys;
