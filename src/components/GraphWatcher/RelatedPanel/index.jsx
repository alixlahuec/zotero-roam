import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Classes } from "@blueprintjs/core";

import AuxiliaryDialog from "../AuxiliaryDialog";
import CitekeyPopover from "../CitekeyPopover";
import { pluralize, sortElems } from "../../../utils";

import * as customPropTypes from "../../../propTypes";
import "./index.css";

const labelId = "zr-related-panel-label";

const RelatedItem = React.memo(function RelatedItem(props) {
	const { allAbstractsShown, closeDialog, inGraph, item, metadataSettings, type } = props;
	const { children: { pdfs, notes }, raw } = item;
	const [isAbstractVisible, setAbstractVisible] = useState(allAbstractsShown);

	const toggleAbstract = useCallback(() => {
		setAbstractVisible(prevState => !prevState);
	}, []);

	const has_timestamp = useMemo(() => {
		return type == "added_on"
			? <span className={[Classes.MENU_ITEM_LABEL, "zr-text-small", "zr-related-item--timestamp"].join(" ")}>
				{item.timestamp}
			</span>
			: null;
	}, [item.timestamp, type]);

	const has_abstract = useMemo(() => {
		if(!item.abstract){
			return null;
		} else {
			return (
				<div className="zr-related-item--abstract">
					<Button className="zr-text-small"
						zr-role="abstract-toggle"
						icon={isAbstractVisible ? "chevron-down" : "chevron-right"}
						onClick={toggleAbstract} 
						intent="primary" 
						minimal={true} 
						small={true}
					>
                        Abstract
					</Button>
					{isAbstractVisible
						? <span zr-role="abstract-text" className="zr-text-small zr-auxiliary">{item.abstract}</span>
						: null}
				</div>
			);
		}
	}, [isAbstractVisible, item.abstract, toggleAbstract]);

	const itemActions = useMemo(() => {
		return <CitekeyPopover 
			closeDialog={closeDialog} 
			inGraph={inGraph} 
			item={raw} 
			metadataSettings={metadataSettings} 
			notes={notes} 
			pdfs={pdfs} />;
	}, [closeDialog, inGraph, metadataSettings, notes, pdfs, raw]);

	useEffect(() => {
		setAbstractVisible(allAbstractsShown);
	}, [allAbstractsShown]);

	return (
		<li className="zr-related-item" data-item-type={item.itemType} data-in-graph={(inGraph != false).toString()}>
			<div className={ Classes.MENU_ITEM } label={item.key}>
				{has_timestamp}
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{display: "flex"}}>
						<div className="zr-related-item-contents--metadata">
							<span className="zr-item-title" style={{ whiteSpace: "normal" }}>{item.title}</span>
							<span className="zr-highlight">{item.meta}</span>
						</div>
						<span className="zr-related-item-contents--actions">
							{itemActions}
						</span>
					</div>
					{has_abstract}
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

const RelatedList = React.memo(function RelatedList(props) {
	const { allAbstractsShown, closeDialog, items, metadataSettings, type } = props;

	const sortedItems = useMemo(() => {
		let sort = type == "added_on" ? "added" : "meta";
		return sortElems(items, sort);
	}, [items, type]);

	return (
		<ul className={Classes.LIST_UNSTYLED}>
			{sortedItems.map(it => {
				return <RelatedItem key={[it.location, it.key].join("-")} 
					allAbstractsShown={allAbstractsShown} 
					closeDialog={closeDialog}
					inGraph={it.inGraph} 
					item={it} 
					metadataSettings={metadataSettings}
					type={type} />;
			})
			}
		</ul>
	);
});
RelatedList.propTypes = {
	allAbstractsShown: PropTypes.bool,
	closeDialog: PropTypes.func,
	items: PropTypes.arrayOf(customPropTypes.cleanRelatedItemType),
	metadataSettings: PropTypes.object,
	type: PropTypes.oneOf(["added_on", "with_abstract", "with_tag"])
};

const RelatedPanel = React.memo(function RelatedPanel(props) {
	const { isOpen, items, metadataSettings, onClose, portalId, show } = props;
	const [isShowingAllAbstracts, setShowingAllAbstracts] = useState(false);

	const relationship = useMemo(() => {
		const { title, type } = show;
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
	}, [show]);

	const panelLabel = useMemo(() => {
		return <h5 id={labelId} className="panel-tt">{pluralize(items.length, relationship.string, relationship.suffix)}</h5>;
	}, [items.length, relationship]);

	const headerRight = useMemo(() => {
		return (
			<div className={["header-right", "zr-auxiliary"].join(" ")}>
				<Button icon="small-cross" minimal={true} onClick={onClose} />
			</div>
		);
	}, [onClose]);

	const toggleAbstracts = useCallback(() => {
		setShowingAllAbstracts(!isShowingAllAbstracts);
	}, [isShowingAllAbstracts]);

	return (
		<AuxiliaryDialog
			ariaLabelledBy={labelId}
			className="related"
			isOpen={isOpen}
			onClose={onClose}
			portalId={portalId}
		>
			<div className={ Classes.DIALOG_BODY }>
				<div className="header-content">
					<div className="header-left">
						{panelLabel}
						<Button className="zr-text-small" 
							icon={isShowingAllAbstracts ? "eye-off" : "eye-open"} 
							minimal={true} 
							onClick={toggleAbstracts}
							zr-role="toggle-abstracts"
						>
							{isShowingAllAbstracts ? "Hide" : "Show"} all abstracts
						</Button>
					</div>
					{headerRight}
				</div>
				<div className="rendered-div">
					<RelatedList 
						allAbstractsShown={isShowingAllAbstracts}
						closeDialog={onClose}
						items={items}
						metadataSettings={metadataSettings}
						type={show.type}
					/>
				</div>
			</div>
		</AuxiliaryDialog>
	);
});
RelatedPanel.propTypes = {
	isOpen: PropTypes.bool,
	items: PropTypes.arrayOf(customPropTypes.cleanRelatedItemType),
	metadataSettings: PropTypes.object,
	onClose: PropTypes.func,
	portalId: PropTypes.string,
	show: PropTypes.shape({
		title: PropTypes.string,
		type: PropTypes.oneOf(["added_on", "with_abstract", "with_tag"])
	})
};

export default RelatedPanel;
