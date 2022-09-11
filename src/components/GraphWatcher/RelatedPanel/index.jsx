import { arrayOf, bool, func, oneOf, oneOfType, shape, string } from "prop-types";
import { memo, useEffect, useMemo } from "react";

import { Button, Classes } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import CitekeyPopover from "Components/CitekeyPopover";
import ErrorBoundary from "Components/Errors/ErrorBoundary";

import useBool from "../../../hooks/useBool";

import { pluralize, sortElems } from "../../../utils";

import * as customPropTypes from "../../../propTypes";
import { CustomClasses } from "../../../constants";

import "./index.css";


const labelId = "zr-related-panel-label";

const Abstract = memo(function Abstract({ abstract, allAbstractsShown }) {
	const [isVisible, { set: setVisible, toggle: toggleAbstract }] = useBool(allAbstractsShown);

	useEffect(() => {
		setVisible(allAbstractsShown);
	}, [allAbstractsShown, setVisible]);

	if(!abstract){
		return null;
	} else {
		return (
			<div className="zr-related-item--abstract">
				<Button className={CustomClasses.TEXT_SMALL}
					zr-role="abstract-toggle"
					icon={isVisible ? "chevron-down" : "chevron-right"}
					onClick={toggleAbstract}
					minimal={true} 
					small={true} >
					Abstract
				</Button>
				{isVisible
					? <span zr-role="abstract-text" className={[CustomClasses.TEXT_SMALL, CustomClasses.TEXT_AUXILIARY].join(" ")}>{abstract}</span>
					: null}
			</div>
		);
	}
});
Abstract.propTypes = {
	abstract: string,
	allAbstractsShown: bool
};

const Timestamp = memo(function Timestamp({ timestamp, type }){
	return type == "added_on"
		? <span className={[Classes.MENU_ITEM_LABEL, CustomClasses.TEXT_SMALL, "zr-related-item--timestamp"].join(" ")}>
			{timestamp}
		</span>
		: null;
});
Timestamp.propTypes = {
	timestamp: string,
	type: oneOf(["added_on", "with_abstract", "with_tag", "is_citation", "is_reference"])
};

const RelatedItem = memo(function RelatedItem(props) {
	const { allAbstractsShown, closeDialog, inGraph, item, type } = props;
	const { children: { pdfs, notes }, raw } = item;

	return (
		<li className="zr-related-item" data-in-graph={(inGraph != false).toString()}>
			<div className={ Classes.MENU_ITEM } label={item.key}>
				<Timestamp timestamp={item.timestamp} type={type} />
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{ display: "flex" }}>
						<div className="zr-related-item-contents--metadata" >
							<span className="zr-related-item--title" data-item-type={item.itemType}>{item.title}</span>
							<span className={CustomClasses.TEXT_ACCENT_1}>{item.meta}</span>
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

const RelatedList = memo(function RelatedList(props) {
	const { allAbstractsShown, closeDialog, items, type } = props;

	const sortedItems = useMemo(() => {
		const sort = type == "added_on" ? "added" : "meta";
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

const RelatedPanel = memo(function RelatedPanel(props) {
	const { isOpen, items, onClose, show } = props;
	const [isShowingAllAbstracts, { toggle: toggleAbstracts }] = useBool(false);

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
		default:
            //
		}
	}, [show]);

	const panelLabel = useMemo(() => {
		return <h5 id={labelId} className="panel-tt">{pluralize(items.length, relationship.string, relationship.suffix)}</h5>;
	}, [items.length, relationship]);

	const headerRight = useMemo(() => {
		return (
			<div className={["header-right", CustomClasses.TEXT_AUXILIARY].join(" ")}>
				<Button icon="cross" minimal={true} onClick={onClose} title="Close dialog" />
			</div>
		);
	}, [onClose]);

	return (
		<AuxiliaryDialog
			ariaLabelledBy={labelId}
			className="related"
			isOpen={isOpen}
			onClose={onClose}
		>
			<div className={ Classes.DIALOG_BODY }>
				<ErrorBoundary>
					<div className="header-content">
						<div className="header-left">
							{panelLabel}
							<Button className={CustomClasses.TEXT_SMALL}
								minimal={true} 
								onClick={toggleAbstracts}
								zr-role="toggle-abstracts" >
								{isShowingAllAbstracts ? "Hide" : "Show"} abstracts
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
				</ErrorBoundary>
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
