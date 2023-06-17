import { memo } from "react";
import { Icon } from "@blueprintjs/core";

import ActionsMenu from "../ActionsMenu";
import { ListItem } from "Components/DataList";
import RoamTag from "./RoamTag";
import ZoteroTag from "./ZoteroTag";

import { getTagUsage, isSingleton, makeSuggestionFor } from "../utils";
import { pluralize } from "../../../../utils";

import { CustomClasses } from "../../../../constants";
import { ZLibrary, ZTagEntry } from "Types/transforms";


type OwnProps = {
	entry: ZTagEntry,
	library: ZLibrary
};

const ItemEntry = memo<OwnProps>(function ItemEntry({ entry, library }){
	const is_singleton = isSingleton(entry);
	const suggestion = makeSuggestionFor(entry);
	const usage = getTagUsage(entry);

	return (
		<ListItem className="zr-tag-entry" data-token={entry.token} in-graph={(entry.roam.length > 0).toString()}>
			<div zr-role="item-header">
				<div zr-role="item-info">
					{entry.roam.length > 0
						? <Icon htmlTitle={"This tag exists in Roam (" + entry.roam.map(el => el.title).join(", ") + ")"} icon="tick-circle" intent="success" size={14} />
						: <Icon icon="blank" />}
					<span className={CustomClasses.TEXT_AUXILIARY} zr-role="title">{entry.token}</span>
					{!is_singleton && <span className={CustomClasses.TEXT_SMALL} zr-role="item-additional">
						{entry.roam.map(elem => <RoamTag key={elem.title} text={elem.title} uid={elem.uid} /> )}
						{entry.zotero.map((elem) => {
							const { tag, meta: { type } } = elem;
							return <ZoteroTag key={[tag, type].join("_")} tagElement={elem} />;
						} )}
					</span>}
				</div>
				<span className={[CustomClasses.TEXT_SECONDARY, CustomClasses.TEXT_SMALL].join(" ")} zr-role="item-count">{pluralize(usage, "item")}</span>
				<div zr-role="item-actions">
					<ActionsMenu deleteTags={true} library={library} mergeAs={true} suggestion={suggestion} />
				</div>
			</div>
		</ListItem>
	);
});


export default ItemEntry;