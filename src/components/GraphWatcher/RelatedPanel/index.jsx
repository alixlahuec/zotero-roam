import React, { useCallback, useEffect, useMemo, useState } from "react";
import { arrayOf, bool, func, oneOf, oneOfType, shape, string } from "prop-types";
import { Button, Classes } from "@blueprintjs/core";

import AuxiliaryDialog from "../../AuxiliaryDialog";
import CitekeyPopover from "../../CitekeyPopover";
import { pluralize, sortElems } from "../../../utils";

import SentryBoundary from "../../Errors/SentryBoundary";
import * as customPropTypes from "../../../propTypes";
import "./index.css";

const labelId = "zr-related-panel-label";

const Abstract = React.memo(function Abstract({ abstract, allAbstractsShown }) {
	const [isVisible, setVisible] = useState(allAbstractsShown);

	const toggleAbstract = useCallback(() => setVisible(prevState => !prevState), []);

	useEffect(() => {
		setVisible(allAbstractsShown);
	}, [allAbstractsShown]);

	if(!abstract){
		return null;
	} else {
		return (
			<div className="zr-related-item--abstract">
				<Button className="zr-text-small"
					zr-role="abstract-toggle"
					icon={isVisible ? "chevron-down" : "chevron-right"}
					onClick={toggleAbstract}
					minimal={true} 
					small={true} >
					Abstract
				</Button>
				{isVisible
					? <span zr-role="abstract-text" className="zr-text-small zr-auxiliary">{abstract}</span>
					: null}
			</div>
		);
	}
});
Abstract.propTypes = {
	abstract: string,
	allAbstractsShown: bool
};

const Timestamp = React.memo(function Timestamp({ timestamp, type }){
	return type == "added_on"
		? <span className={[Classes.MENU_ITEM_LABEL, "zr-text-small", "zr-related-item--timestamp"].join(" ")}>
			{timestamp}
		</span>
		: null;
});
Timestamp.propTypes = {
	timestamp: string,
	type: oneOf(["added_on", "with_abstract", "with_tag", "is_citation", "is_reference"])
};

const RelatedItem = React.memo(function RelatedItem(props) {
	const { allAbstractsShown, closeDialog, inGraph, item, type } = props;
	const { children: { pdfs, notes }, raw } = item;

	return (
		<li className="zr-related-item" data-in-graph={(inGraph != false).toString()}>
			<div className={ Classes.MENU_ITEM } label={item.key}>
				<Timestamp timestamp={item.timestamp} type={type} />
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{display: "flex"}}>
						<div className="zr-related-item-contents--metadata" >
							<span className="zr-related-item--title" data-item-type={item.itemType}>{item.title}</span>
							<span className="zr-accent-1">{item.meta}</span>
						</div>
						<span className="zr-related-item-contents--actions">
							<CitekeyPopover 
								closeDialog={closeDialog} 
								inGraph={inGraph} 
								item={raw}
								notes={notes} 
								pdfs={pdfs} />
						</span>
					</div>
					<Abstract abstract={item.abstract} allAbstractsShown={allAbstractsShown} />
				</div>
			</div>
		</li>
	);
});
RelatedItem.propTypes = {
	allAbstractsShown: bool,
	closeDialog: func,
	inGraph: oneOfType([string, oneOf([false])]),
	item: customPropTypes.cleanRelatedItemType,
	type: oneOf(["added_on", "with_abstract", "with_tag", "is_citation", "is_reference"])
};

const RelatedList = React.memo(function RelatedList(props) {
	const { allAbstractsShown, closeDialog, items, type } = props;

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
					type={type} />;
			})
			}
		</ul>
	);
});
RelatedList.propTypes = {
	allAbstractsShown: bool,
	closeDialog: func,
	items: arrayOf(customPropTypes.cleanRelatedItemType),
	type: oneOf(["added_on", "with_abstract", "with_tag"])
};

const RelatedPanel = React.memo(function RelatedPanel(props) {
	const { isOpen, items, onClose, show } = props;
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
				<Button icon="cross" minimal={true} onClick={onClose} />
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
		>
			<div className={ Classes.DIALOG_BODY }>
				<SentryBoundary feature="dialog-related" extra={show}>
					<div className="header-content">
						<div className="header-left">
							{panelLabel}
							<Button className="zr-text-small" 
								icon={isShowingAllAbstracts ? "eye-off" : "eye-open"} 
								minimal={true} 
								onClick={toggleAbstracts}
								zr-role="toggle-abstracts" >
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
							type={show.type}
						/>
					</div>	
				</SentryBoundary>
			</div>
		</AuxiliaryDialog>
	);
});
RelatedPanel.propTypes = {
	isOpen: bool,
	items: arrayOf(customPropTypes.cleanRelatedItemType),
	onClose: func,
	show: shape({
		title: string,
		type: oneOf(["added_on", "with_abstract", "with_tag"])
	})
};

export default RelatedPanel;
