import React from "react";
import { func } from "prop-types";

import { ListItem } from "../../../DataList";
import CitekeyPopover from "../../../CitekeyPopover";

import * as customPropTypes from "../../../../propTypes";

function ItemElement({ item, onClose }){
	const { children, inGraph, itemType, meta, publication, raw, title } = item;

	return <ListItem className="zr-query--result" >
		<div zr-role="item-header">
			<div zr-role="item-details">
				<span className="zr-auxiliary" data-item-type={itemType} zr-role="item-title">{title}</span>
				<span className="zr-accent-1">{meta}</span>
				<span className="zr-secondary">{publication}</span>
			</div>
			<CitekeyPopover closeDialog={onClose} inGraph={inGraph} item={raw} notes={children.notes} pdfs={children.pdfs} />
		</div>
	</ListItem>;
}
ItemElement.propTypes = {
	item: customPropTypes.cleanLibraryItemType,
	onClose: func
};

export default ItemElement;
