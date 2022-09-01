import { func } from "prop-types";

import { Button } from "@blueprintjs/core";

import CitekeyPopover from "../../../CitekeyPopover";
import DataDrawer from "../../../DataDrawer";
import { ListItem } from "../../../DataList";
import NotesDrawer from "../../../NotesDrawer";

import { pluralize } from "../../../../utils";
import useBool from "../../../../hooks/useBool";

import { CustomClasses } from "../../../../constants";

import * as customPropTypes from "../../../../propTypes";


function ItemElement({ item, onClose }){
	const { children, inGraph, itemType, meta, publication, raw, title } = item;
	const [isDataDrawerOpen, { on: openDataDrawer, off: closeDataDrawer }] = useBool(false);
	const [isNotesDrawerOpen, { on: openNotesDrawer, off: closeNotesDrawer }] = useBool(false);

	return <>
		<ListItem className="zr-query--result" >
			<div zr-role="item-header">
				<div zr-role="item-details">
					<span className={CustomClasses.TEXT_AUXILIARY} data-item-type={itemType} zr-role="item-title">{title}</span>
					<span className={CustomClasses.TEXT_ACCENT_1}>{meta}</span>
					<span className={CustomClasses.TEXT_SECONDARY}>{publication}</span>
					<Button icon="eye-open" minimal={true} onClick={openDataDrawer} title="Show the item's raw metadata" />
					{children.notes.length > 0
						? <Button className={CustomClasses.TEXT_SMALL} icon="duplicate" minimal={true} text={pluralize(children.notes.length, "linked note")} onClick={openNotesDrawer} title="Show the item's linked notes" />
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
