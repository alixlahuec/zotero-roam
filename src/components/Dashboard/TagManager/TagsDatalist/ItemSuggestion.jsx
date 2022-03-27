import React, { useCallback, useState } from "react";
import { Button, Icon, Tag } from "@blueprintjs/core";

import { ListItem } from "../../../DataList";
import Suggest from "../Suggest";

import { pluralize } from "../../../../utils";

import * as customPropTypes from "../../../../propTypes";

const ItemSuggestion = React.memo(function ItemSuggestion({ entry, library }){
	const [isCollapsed, setIsCollapsed] = useState(true);
	const toggleCollapse = useCallback(() => setIsCollapsed(prevState => !prevState), []);

	return (
		<ListItem className="zr-tag-suggestion" data-token={entry.token} in-graph={(entry.roam.length > 0).toString()}>
			<span zr-role="item-header">
				{entry.roam.length > 0
					? <Icon htmlTitle={"This tag exists in Roam (" + entry.roam.map(el => el.title).join(", ") + ")"} icon="tick-circle" intent="success" />
					: <Icon icon="blank" />}
				<span className="zr-auxiliary" zr-role="title">{entry.token}</span>
				<Tag 
					htmlTitle={entry.zotero.map(t => t.tag).join(" - ")} 
					intent="warning" 
					icon="tag" 
					minimal={true}
					zr-role="item-count" >
					{pluralize(entry.zotero.length, "tag")}
				</Tag>
				<span zr-role="item-actions">
					<Suggest entry={entry} library={library} />
					<Button icon={isCollapsed ? "chevron-down" : "chevron-up"} minimal={true} onClick={toggleCollapse} />
				</span>
			</span>
			<span zr-role="item-details" is-collapsed={isCollapsed.toString()} >
				Lorem ipsum
			</span>
		</ListItem>
	);
});
ItemSuggestion.propTypes = {
	entry: customPropTypes.taglistEntry,
	library: customPropTypes.zoteroLibraryType
};

export default ItemSuggestion;
