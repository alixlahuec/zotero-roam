import React from "react";
import { func } from "prop-types";
import { Button } from "@blueprintjs/core";

import CitekeyPopover from "../../../CitekeyPopover";
import DataDrawer from "../../../DataDrawer";
import { ListItem } from "../../../DataList";
import NotesDrawer from "../../../NotesDrawer";

import { pluralize } from "../../../../utils";
import useBool from "../../../../hooks/useBool";

import * as customPropTypes from "../../../../propTypes";

function ItemElement({ item, onClose }){
	const { children, inGraph, itemType, meta, publication, raw, title } = item;
	const [isDataDrawerOpen,,, openDataDrawer, closeDataDrawer] = useBool(false);
	const [isNotesDrawerOpen,,, openNotesDrawer, closeNotesDrawer] = useBool(false);

	return <>
		<ListItem className="zr-query--result" >
			<div zr-role="item-header">
				<div zr-role="item-details">
					<span className="zr-auxiliary" data-item-type={itemType} zr-role="item-title">{title}</span>
					<span className="zr-accent-1">{meta}</span>
					<span className="zr-secondary">{publication}</span>
					<Button icon="eye-open" minimal={true} onClick={openDataDrawer} />
					{children.notes.length > 0
						? <Button className="zr-text-small" icon="duplicate" minimal={true} text={pluralize(children.notes.length, "linked note")} onClick={openNotesDrawer} />
						: null}
				</div>
				<CitekeyPopover closeDialog={onClose} inGraph={inGraph} item={raw} notes={children.notes} pdfs={children.pdfs} />
			</div>
		</ListItem>
		<DataDrawer item={item} isOpen={isDataDrawerOpen} onClose={closeDataDrawer} />
		{children.notes.length > 0 && <NotesDrawer notes={children.notes} isOpen={isNotesDrawerOpen} onClose={closeNotesDrawer} />}
	</>;
}
ItemElement.propTypes = {
	item: customPropTypes.cleanLibraryItemType,
	onClose: func
};

export default ItemElement;
