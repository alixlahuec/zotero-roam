import { Tag } from "@blueprintjs/core";

import { ZoteroAPI } from "@clients/zotero";


type OwnProps = {
	tagElement: ZoteroAPI.Tag
};

function ZoteroTag({ tagElement }: OwnProps){
	const { tag, meta: { numItems, type = 0 } } = tagElement;

	return (
		<Tag 
			active={true}
			intent="warning"
			minimal={true} 
			multiline={false}
			data-tag-source="zotero" data-tag={tag} data-tag-type={type} >
			{tag + " (" + numItems + ")"}
		</Tag>
	);
}


export default ZoteroTag;