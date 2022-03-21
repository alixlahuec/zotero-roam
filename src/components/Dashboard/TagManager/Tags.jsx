import React from "react";
import { string } from "prop-types";
import { Tag } from "@blueprintjs/core";

import * as customPropTypes from "../../../propTypes";

function RoamTag({ text, uid = null }){
	return (
		<Tag 
			active={true} 
			className="zr-tag--roam" 
			minimal={true} 
			multiline={true}
			data-tag-source="roam" data-tag={text} data-uid={uid} >
			{text}
		</Tag>
	);
}
RoamTag.propTypes = {
	text: string,
	uid: string
};

function ZoteroTag({ tagElement }){
	const { tag, meta: { numItems, type = 0 } } = tagElement;

	return (
		<Tag 
			active={true} 
			className="zr-tag--zotero" 
			minimal={true} 
			multiline={true}
			data-tag-source="zotero" data-tag={tag} data-tag-type={type} >
			{tag + "(" + numItems + ")"}
		</Tag>
	);
}
ZoteroTag.propTypes = {
	tagElement: customPropTypes.zoteroTagType
};

export {
	RoamTag,
	ZoteroTag
};
