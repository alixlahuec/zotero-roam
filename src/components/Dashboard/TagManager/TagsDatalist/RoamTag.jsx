import { string } from "prop-types";

import { Tag } from "@blueprintjs/core";


function RoamTag({ text, uid = null }){
	return (
		<Tag 
			active={true}
			intent="primary" 
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

export default RoamTag;
