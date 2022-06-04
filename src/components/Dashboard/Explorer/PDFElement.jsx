import React, { useCallback, useState } from "react";
import { Button } from "@blueprintjs/core";

import ButtonLink from "../../ButtonLink";
import DataDrawer from "../../DataDrawer";
import { ListItem } from "../../DataList";

import { getPDFLink, pluralize } from "../../../utils";

import * as customPropTypes from "../../../propTypes";
function PDFElement({ item }){
	const [isDrawerOpen, setDrawerOpen] = useState(false);

	const openDrawer = useCallback(() => setDrawerOpen(true), []);
	const closeDrawer = useCallback(() => setDrawerOpen(false), []);

	return <>
		<ListItem className="zr-query--result" >
			<div zr-role="item-header">
				<div zr-role="item-details">
					<span className="zr-auxiliary" zr-role="item-title">{item.data.filename || item.data.title}</span>
					<Button className="zr-text-small" icon="eye-open" minimal={true} onClick={openDrawer} />
					{item.meta.numChildren > 0
						? <Button className="zr-text-small" icon="duplicate" minimal={true} text={pluralize(item.meta.numChildren, "linked note")} />
						: null}
				</div>
				<ButtonLink className="zr-text-small" href={getPDFLink(item, "href")} icon="paperclip">Open PDF</ButtonLink>
			</div>
		</ListItem>
		<DataDrawer item={item} isOpen={isDrawerOpen} onClose={closeDrawer} />
	</>;
}
PDFElement.propTypes = {
	item: customPropTypes.zoteroItemType
};

export default PDFElement;