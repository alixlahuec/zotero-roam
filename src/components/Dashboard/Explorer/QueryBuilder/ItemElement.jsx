import React, { useCallback, useState } from "react";
import { func } from "prop-types";
import { Button } from "@blueprintjs/core";

import DataDrawer from "../../../DataDrawer";
import { ListItem } from "../../../DataList";
import CitekeyPopover from "../../../CitekeyPopover";

import * as customPropTypes from "../../../../propTypes";

function ItemElement({ item, onClose }){
	const { children, inGraph, itemType, meta, publication, raw, title } = item;
	const [isDataDrawerOpen, setDataDrawerOpen] = useState(false);
	const openDataDrawer = useCallback(() => setDataDrawerOpen(true), []);
	const closeDataDrawer = useCallback(() => setDataDrawerOpen(false), []);

	return <>
		<ListItem className="zr-query--result" >
			<div zr-role="item-header">
				<div zr-role="item-details">
					<span className="zr-auxiliary" data-item-type={itemType} zr-role="item-title">{title}</span>
					<span className="zr-accent-1">{meta}</span>
					<span className="zr-secondary">{publication}</span>
					<Button icon="eye-open" minimal={true} onClick={openDataDrawer} />
				</div>
				<CitekeyPopover closeDialog={onClose} inGraph={inGraph} item={raw} notes={children.notes} pdfs={children.pdfs} />
			</div>
		</ListItem>
		<DataDrawer item={item} isOpen={isDataDrawerOpen} onClose={closeDataDrawer} />
	</>;
}
ItemElement.propTypes = {
	item: customPropTypes.cleanLibraryItemType,
	onClose: func
};

export default ItemElement;
