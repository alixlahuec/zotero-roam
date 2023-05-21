import { Tag } from "@blueprintjs/core";


type OwnProps = {
	text: string,
	uid: string | null
};

function RoamTag({ text, uid = null }: OwnProps){
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


export default RoamTag;
