import React from "react";
import { Icon } from "@blueprintjs/core";

import { ListItem } from "../../../DataList";
import ActionsMenu from "../ActionsMenu";
import RoamTag from "./RoamTag";
import ZoteroTag from "./ZoteroTag";
import { pluralize } from "../../../../utils";
import { getTagUsage, isSingleton, makeSuggestionFor } from "../utils";

import * as customPropTypes from "../../../../propTypes";

const ItemEntry = React.memo(function ItemEntry({ entry, library }){
	const is_singleton = isSingleton(entry);
	const suggestion = makeSuggestionFor(entry);
	const usage = getTagUsage(entry);

	return (
		<ListItem className="zr-tag-entry" data-token={entry.token} in-graph={(entry.roam.length > 0).toString()}>
			<span zr-role="item-header">
				{entry.roam.length > 0
					? <Icon htmlTitle={"This tag exists in Roam (" + entry.roam.map(el => el.title).join(", ") + ")"} icon="tick-circle" intent="success" />
					: <Icon icon="blank" />}
				<span className="zr-auxiliary" zr-role="title">{entry.token}</span>
				<span className={["zr-secondary", "zr-text-small"].join(" ")} zr-role="item-count">{pluralize(usage, "item")}</span>
				<span zr-role="item-actions">
					<ActionsMenu deleteTags={true} library={library} mergeAs={true} suggestion={suggestion} />
				</span>
			</span>
			{!is_singleton && <span className="zr-text-small" zr-role="item-additional">
				{entry.roam.map(elem => <RoamTag key={elem.title} text={elem.title} uid={elem.uid} /> )}
				{entry.zotero.map((elem) => {
					const { tag, meta: { type }} = elem;
					return <ZoteroTag key={[tag, type].join("_")} tagElement={elem} />;
				} )}
			</span>}
		</ListItem>
	);
});
ItemEntry.propTypes = {
	entry: customPropTypes.taglistEntry,
	library: customPropTypes.zoteroLibraryType
};

export default ItemEntry;