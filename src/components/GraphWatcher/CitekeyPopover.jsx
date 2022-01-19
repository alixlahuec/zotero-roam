import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Button, Menu, MenuDivider, MenuItem } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import { openInSidebarByUID, openPageByUID } from "../../roam";
import { getLocalLink, getWebLink } from "../../utils";

const CitekeyPopover = React.memo(function CitekeyPopover(props) {
	const { closeDialog, inGraph, item } = props;

	const popoverMenuProps = useMemo(() => {
		return {
			className: "zr-library-item-popover",
			interactionKind: "hover",
			placement: "right-start",
			lazy: true
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

	const navigateToPage = useCallback(() => {
		if(inGraph != false){
			openPageByUID(inGraph);
			closeDialog();
		}
	}, [closeDialog, inGraph]);

	const actionsMenu = useMemo(() => {
		if(!inGraph){
			return (
				<Menu className="zr-text-small">
					<MenuItem icon="add" text="Import metadata" />
					<MenuItem icon="inheritance" text="Import & open in sidebar" />
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
						onClick={() => openInSidebarByUID(inGraph)} />
					<MenuDivider />
					{zoteroLinks}
				</Menu>
			);
		}
	}, [inGraph, navigateToPage, zoteroLinks]);

	return (
		<Popover2 {...popoverMenuProps} content={actionsMenu}>
			<Button text={"@" + item.key} rightIcon="chevron-right" minimal={true} small={true} {...buttonProps} />
		</Popover2>
	);
});
CitekeyPopover.propTypes = {
	closeDialog: PropTypes.func,
	inGraph: PropTypes.oneOf(PropTypes.string, false),
	item: PropTypes.object
};

export default CitekeyPopover;
