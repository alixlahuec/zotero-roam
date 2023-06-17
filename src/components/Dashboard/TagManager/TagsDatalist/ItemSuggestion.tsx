import { memo } from "react";
import { Icon, Tag } from "@blueprintjs/core";

import { ListItem } from "Components/DataList";
import Suggest from "../Suggest";

import { pluralize } from "../../../../utils";

import { CustomClasses } from "../../../../constants";
import { ZLibrary, ZTagEntry } from "Types/transforms";


type OwnProps = {
	entry: ZTagEntry,
	library: ZLibrary
};

const ItemSuggestion = memo<OwnProps>(function ItemSuggestion({ entry, library }){

	return (
		<ListItem className="zr-tag-suggestion" data-token={entry.token} in-graph={(entry.roam.length > 0).toString()}>
			<div zr-role="item-header">
				<span zr-role="item-info">
					{entry.roam.length > 0
						? <Icon htmlTitle={"This tag exists in Roam (" + entry.roam.map(el => el.title).join(", ") + ")"} icon="tick-circle" intent="success" size={14} />
						: <Icon icon="blank" size={14} />}
					<span className={CustomClasses.TEXT_AUXILIARY} zr-role="title">{entry.token}</span>
				</span>
				<Tag 
					htmlTitle={entry.zotero.map(t => t.tag).join(" - ")} 
					intent="warning" 
					icon="tag" 
					minimal={true}
					zr-role="item-count" >
					{pluralize(entry.zotero.length, "tag")}
				</Tag>
				<div zr-role="item-actions">
					<Suggest entry={entry} library={library} />
				</div>
			</div>
		</ListItem>
	);
});


export default ItemSuggestion;
