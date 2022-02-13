import React, { useCallback} from "react";
import { bool, func, string } from "prop-types";
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

function ZoteroTag({ handleSelect = () => {}, isSelected = true, tagElement }){
	const { tag, meta: { numItems, type = 0 } } = tagElement;

	const onClick = useCallback(() => handleSelect(tag), [handleSelect, tag]);

	return (
		<Tag 
			active={isSelected} 
			className="zr-tag--zotero"
			interactive={true} 
			minimal={true} 
			multiline={true} 
			onClick={onClick}
			data-tag-source="zotero" data-tag={tag} data-tag-type={type} >
			{tag + "(" + numItems + ")"}
		</Tag>
	);
}
ZoteroTag.propTypes = {
	handleSelect: func,
	isSelected: bool,
	tagElement: customPropTypes.zoteroTagType
};

export {
	RoamTag,
	ZoteroTag
};
