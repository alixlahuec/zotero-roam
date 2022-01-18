import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Menu, MenuItem, Overlay } from "@blueprintjs/core";

import { queryItems } from "../../../queries";
import { formatItemReference } from "../../../utils";
import { createPortal } from "react-dom";

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
	const { coords, isOpen, itemsMap, target } = props;

	const citekey = target.parentElement.dataset.linkTitle;
	const pageUID = target.parentElement.dataset.linkUid;

	const item = useMemo(() => {
		return itemsMap.get(citekey).data;
	}, [citekey, itemsMap]);

	return (
		<Overlay
			isOpen={isOpen}
			hasBackdrop={false}
			lazy={false}
			usePortal={false}>
			<div className="zr-context-menu--wrapper" style={coords}>
				<Menu className="zr-context-menu--option">
					<MenuItem icon="arrow-right" 
						text="Import metadata" 
						data-uid={pageUID} 
						data-item-type={item.data.itemType}
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
	portalId: PropTypes.string,
	target: PropTypes.node
};

const InlineCitekeys = React.memo(function InlineCitekeys(props) {
	const { dataRequests, portalId, renderInline } = props;
	const [isContextMenuOpen, setContextMenuOpen] = useState(false);
	const [contextMenuCoordinates, setContextMenuCoordinates] = useState({left: 0, top:0});
	const [contextMenuTarget, setContextMenuTarget] = useState(null);

	const itemsMap = getItems(dataRequests) || new Map();
	const openContextMenu = useCallback((e) => {
		e.preventDefault();
		const { pageX: left, pageY: top, target} = e;
		setContextMenuCoordinates({left, top});
		setContextMenuTarget(target);
		setContextMenuOpen(true);
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
					linkElement.addEventListener("contextmenu", openContextMenu);
				} else {
					linkElement.textContent = citekey;
					linkElement.removeEventListener("contextmenu", openContextMenu);
				}
			}
		}
	}, [itemsMap]);

	const cleanupCitekeyRefs = useCallback(() => {
		let refCitekeys = document.querySelectorAll("span[data-link-title^='@'][data-in-library]");
		refCitekeys.forEach(ck => { 
			ck.removeAttribute("data-in-library");
			let linkElement = ck.getElementsByClassName("rm-page-ref")[0];
			linkElement.textContent = ck.getAttribute("data-link-title");
			linkElement.removeEventListener("contextmenu", openContextMenu);});
	}, []);

	useEffect(() => {
		if(renderInline == true){
			const watcher = setInterval(
				() => {
					renderCitekeyRefs();
				}, 1000
			);
			return function cleanup() {
				clearInterval(watcher);
				cleanupCitekeyRefs;
			};
		}
	}, [renderInline]);

	return (
		createPortal(
			<CitekeyContextMenu 
				coords={contextMenuCoordinates} 
				isOpen={isContextMenuOpen} 
				itemsMap={itemsMap}
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
