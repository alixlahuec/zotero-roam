import React from "react";

import { ListItem } from "../../DataList";

import * as customPropTypes from "../../../propTypes";
import { getPDFLink, pluralize } from "../../../utils";
import ButtonLink from "../../ButtonLink";

function PDFElement({ item }){
	const name = item.data.filename || item.data.title;
	const link = getPDFLink(item, "href");

	return <ListItem className="zr-query--result" >
		<div zr-role="item-header">
			<div zr-role="item-details">
				<span className="zr-auxiliary" zr-role="item-title">{name}</span>
				{item.meta.numChildren > 0
					? <span className="zr-secondary">{pluralize(item.meta.numChildren, "linked note")}</span>
					: null}
			</div>
			<ButtonLink className="zr-text-small" href={link} icon="paperclip">Open PDF</ButtonLink>
		</div>
	</ListItem>;
}
PDFElement.propTypes = {
	item: customPropTypes.zoteroItemType
};

export default PDFElement;