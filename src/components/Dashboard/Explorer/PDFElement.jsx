import React from "react";
import { Button } from "@blueprintjs/core";

import ButtonLink from "../../ButtonLink";
import DataDrawer from "../../DataDrawer";
import { ListItem } from "../../DataList";
import NotesDrawer from "../../NotesDrawer";

import { pluralize } from "../../../utils";
import useBool from "../../../hooks/useBool";

import { CustomClasses } from "../../../constants";
import * as customPropTypes from "../../../propTypes";
function PDFElement({ item }){
	const [isDataDrawerOpen, { on: openDataDrawer, off: closeDataDrawer }] = useBool(false);
	const [isNotesDrawerOpen, { on: openNotesDrawer, off: closeNotesDrawer}] = useBool(false);

	return <>
		<ListItem className="zr-query--result" >
			<div zr-role="item-header">
				<div zr-role="item-details">
					<span className={CustomClasses.TEXT_AUXILIARY} zr-role="item-title">{item.title}</span>
					{item.parent.key && <span className={CustomClasses.TEXT_ACCENT_1}>@{item.parent.key}</span>}
					<Button className={CustomClasses.TEXT_SMALL} icon="eye-open" minimal={true} onClick={openDataDrawer} />
					{item.annotations.length > 0
						? <Button className={CustomClasses.TEXT_SMALL} icon="duplicate" minimal={true} text={pluralize(item.annotations.length, "linked note")} onClick={openNotesDrawer} />
						: null}
				</div>
				<ButtonLink className={CustomClasses.TEXT_SMALL} href={item.link} icon="paperclip">Open PDF</ButtonLink>
			</div>
		</ListItem>
		<DataDrawer item={item.raw} isOpen={isDataDrawerOpen} onClose={closeDataDrawer} />
		{item.annotations.length > 0 && <NotesDrawer notes={item.annotations} isOpen={isNotesDrawerOpen} onClose={closeNotesDrawer} />}
	</>;
}
PDFElement.propTypes = {
	item: customPropTypes.cleanLibraryPDFType
};

export default PDFElement;