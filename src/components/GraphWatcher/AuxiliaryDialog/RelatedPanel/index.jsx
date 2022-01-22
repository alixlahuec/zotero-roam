import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Classes } from "@blueprintjs/core";

import { pluralize, sortItems } from "../../../../utils";
import CitekeyPopover from "../../CitekeyPopover";
import * as customPropTypes from "../../../../propTypes";

const RelatedItem = React.memo(function RelatedItem(props) {
	const { allAbstractsShown, closeDialog, inGraph, item, metadataSettings, type } = props;
	const { children: { pdfs, notes }, raw } = item;
	const [isAbstractVisible, setAbstractVisible] = useState(allAbstractsShown);

	const toggleAbstract = useCallback(() => {
		setAbstractVisible(!isAbstractVisible);
	}, [isAbstractVisible]);

	const itemActions = useMemo(() => <CitekeyPopover closeDialog={closeDialog} inGraph={inGraph} item={raw} metadataSettings={metadataSettings} notes={notes} pdfs={pdfs} />, [closeDialog, inGraph, metadataSettings, notes, pdfs, raw]);

	useEffect(() => {
		setAbstractVisible(allAbstractsShown);
	}, [allAbstractsShown]);

	return (
		<li className="zr-related-item" data-item-type={item.itemType} data-in-graph={(inGraph != false).toString()}>
			<div className={ Classes.MENU_ITEM } label={item.key}>
				{type == "added_on"
					? <span className={[Classes.MENU_ITEM_LABEL, "zr-text-small", "zr-related-item--timestamp"].join(" ")}>
						{item.timestamp}
					</span>
					: null}
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{display: "flex"}}>
						<div className="zr-related-item-contents--metadata">
							<span className="zotero-roam-search-item-title" style={{ whiteSpace: "normal" }}>{item.title}</span>
							<span className="zr-highlight">{item.meta}</span>
						</div>
						<span className="zr-related-item-contents--actions">
							{itemActions}
						</span>
					</div>
					<div className="zr-related-item--abstract">
						{item.abstract
							? <Button className="zr-text-small"
								zr-role="abstract-toggle"
								icon={isAbstractVisible ? "chevron-down" : "chevron-right"}
								onClick={toggleAbstract} 
								intent="primary" 
								minimal={true} 
								small={true}>Abstract</Button>
							: null}
						{item.abstract && isAbstractVisible
							? <span zr-role="abstract-text" className="zr-text-small zr-auxiliary">{item.abstract}</span>
							: null}
					</div>
				</div>
			</div>
		</li>
	);
});
RelatedItem.propTypes = {
	allAbstractsShown: PropTypes.bool,
	closeDialog: PropTypes.func,
	inGraph: PropTypes.oneOf([PropTypes.string, false]),
	item: customPropTypes.cleanRelatedItemType,
	metadataSettings: PropTypes.object,
	type: PropTypes.oneOf(["added_on", "with_abstract", "with_tag", "is_citation", "is_reference"]),
};

const RelatedPanel = React.memo(function RelatedPanel(props) {
	const { ariaLabelledBy, items, metadataSettings, sort, title, type, onClose } = props;
	const [isShowingAllAbstracts, setShowingAllAbstracts] = useState(false);

	const toggleAbstracts = useCallback(() => {
		setShowingAllAbstracts(!isShowingAllAbstracts);
	}, [isShowingAllAbstracts]);

	const sortedItems = useMemo(() => {
		return sortItems(items, sort);
	}, [items, sort]);

	const relationship = useMemo(() => {
		switch(type){
		case "added_on":
			return {
				string: "item",
				suffix: " added on " + title
			};
		case "with_abstract":
			return {
				string: "abstract",
				suffix: " containing " + title
			};
		case "with_tag":
			return {
				string: "item",
				suffix: " tagged with " + title
			};
		}
	}, [type, title]);

	const panelLabel = useMemo(() => {
		return pluralize(sortedItems.length, relationship.string, relationship.suffix);
	}, [sortedItems.length, relationship]);

	return (
		<>
			<div className="header-content">
				<div className="header-left">
					<h5 id={ariaLabelledBy} className="panel-tt">{panelLabel}</h5>
					<Button className="zr-text-small" zr-role="toggle-abstracts" icon={isShowingAllAbstracts ? "eye-off" : "eye-open"} minimal={true} onClick={toggleAbstracts}>{isShowingAllAbstracts ? "Hide" : "Show"} all abstracts</Button>
				</div>
				<div className={["header-right", "zr-auxiliary"].join(" ")}>
					<Button icon="small-cross" minimal={true} onClick={onClose} />
				</div>
			</div>
			<div className="rendered-div">
				<ul className={Classes.LIST_UNSTYLED}>
					{sortedItems.map(it => {
						return (
							<RelatedItem key={[it.location, it.key].join("-")} 
								allAbstractsShown={isShowingAllAbstracts} 
								closeDialog={onClose}
								inGraph={it.inGraph} 
								item={it} 
								metadataSettings={metadataSettings}
								type={type} />
						);
					})
					}
				</ul>
			</div>
		</>
	);
});
RelatedPanel.propTypes = {
	ariaLabelledBy: PropTypes.string,
	/** Array of related items 
	 * See {@link cleanSemantic} for properties
	 */
	items: PropTypes.arrayOf(customPropTypes.cleanRelatedItemType),
	metadataSettings: PropTypes.object,
	onClose: PropTypes.func,
	portalId: PropTypes.string,
	sort: PropTypes.oneOf(["added", "meta"]),
	title: PropTypes.string,
	type: PropTypes.oneOf(["added_on", "with_abstract", "with_tag", "is_citation", "is_reference"])
};

export default RelatedPanel;
