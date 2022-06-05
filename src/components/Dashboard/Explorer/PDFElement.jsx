import React, { useCallback, useState } from "react";
import { Button } from "@blueprintjs/core";

import ButtonLink from "../../ButtonLink";
import DataDrawer from "../../DataDrawer";
import { ListItem } from "../../DataList";
import NotesDrawer from "../../NotesDrawer";

import { pluralize } from "../../../utils";

import * as customPropTypes from "../../../propTypes";
function PDFElement({ item }){
	const [isDataDrawerOpen, setDataDrawerOpen] = useState(false);
	const [isNotesDrawerOpen, setNotesDrawerOpen] = useState(false);

	const openDataDrawer = useCallback(() => setDataDrawerOpen(true), []);
	const closeDataDrawer = useCallback(() => setDataDrawerOpen(false), []);

	const openNotesDrawer = useCallback(() => setNotesDrawerOpen(true), []);
	const closeNotesDrawer = useCallback(() => setNotesDrawerOpen(false), []);

	return <>
		<ListItem className="zr-query--result" >
			<div zr-role="item-header">
				<div zr-role="item-details">
					<span className="zr-auxiliary" zr-role="item-title">{item.title}</span>
					{item.parent.key && <span className="zr-accent-1">@{item.parent.key}</span>}
					<Button className="zr-text-small" icon="eye-open" minimal={true} onClick={openDataDrawer} />
					{item.annotations.length > 0
						? <Button className="zr-text-small" icon="duplicate" minimal={true} text={pluralize(item.annotations.length, "linked note")} onClick={openNotesDrawer} />
						: null}
				</div>
				<ButtonLink className="zr-text-small" href={item.link} icon="paperclip">Open PDF</ButtonLink>
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