import React from "react";
import { Tag } from "@blueprintjs/core";
import * as customPropTypes from "../../../../propTypes";

function ZoteroTag({ tagElement }){
	const { tag, meta: { numItems, type = 0 } } = tagElement;

	return (
		<Tag 
			active={true} 
			className="zr-tag--zotero" 
			minimal={true} 
			multiline={false}
			data-tag-source="zotero" data-tag={tag} data-tag-type={type} >
			{tag + " (" + numItems + ")"}
		</Tag>
	);
}
ZoteroTag.propTypes = {
	tagElement: customPropTypes.zoteroTagType
};

export default ZoteroTag;