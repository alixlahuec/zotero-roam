import React, { useMemo, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Classes, Dialog } from "@blueprintjs/core";

import "./index.css";
import { makeDNP, makeTimestamp, pluralize } from "../../utils";

/** Formats a list of items for display in AuxiliaryDialog
 * @param {Object[]} items - The list of items to format 
 * @returns {Object[]} - The formatted array
 */
function simplifyRelatedItems(items){
	return items.map(item => {
		let creator = item.meta.creatorSummary || "";
		let pub_year = item.meta.parsedDate ? `(${new Date(item.meta.parsedDate).getUTCFullYear()})` : "";
		return {
			abstract: item.data.abstractNote || "",
			key: item.key,
			meta: [creator, pub_year].filter(Boolean).join(" "),
			title: item.data.title || "",
			added: item.data.dateAdded,
			itemType: item.data.itemType,
			timestamp: makeTimestamp(item.data.dateAdded),
			inGraph: false
		};
	});
}

/** Sorts a list of items by a given key, in ascending order
 * @param {Object[]} items - The list of items to sort 
 * @param {String} sort - The key to sort items on 
 * @returns {Object[]} - The sorted array
 */
function sortItems(items, sort = "meta"){
	return items.sort((a,b) => (a[`${sort}`].toLowerCase() < b[`${sort}`].toLowerCase() ? -1 : 1));
}

function RelatedByAdded(props){
	const { items, date } = props;

	const dnp = useMemo(() => {
		return makeDNP(date);
	}, [date]);

	const sortedItems = useMemo(() => {
		return sortItems(items, "added");
	}, [items]);

	return (
		<>
			<h5>{pluralize(sortedItems.length, "item", ` added on ${dnp}`)}</h5>
			<ul className={ Classes.LIST_UNSTYLED }>
				{sortedItems.map(it => {
					let location = it.library.type + "s/" + it.library.id;
					return (
						<RelatedItem key={[location, it.key].join("-")} item={it} type="added" />
					);
				})}
			</ul>
		</>
	);
}
RelatedByAdded.propTypes = {
	items: PropTypes.array,
	date: PropTypes.date
};

const RelatedItem = React.memo(function RelatedItem(props) {
	const { item, type, allAbstractsShown } = props;
	const [isAbstractVisible, setAbstractVisible] = useState(allAbstractsShown);

	const toggleAbstract = useCallback(() => {
		setAbstractVisible(!isAbstractVisible);
	}, [isAbstractVisible]);

	const buttonProps = useMemo(() => {
		if(item.inGraph){
			return {
				icon: "symbol-circle",
				intent: "success",
				className: "zotero-roam-list-item-go-to-page",
				"data-citekey": item.key,
				"data-uid": item.inGraph
			};
		} else {
			return {
				icon: "minus",
				intent: "warning",
				className: "zotero-roam-add-to-graph"
			};
		}
	}, [item.inGraph]);

	return (
		<li className="zotero-roam-list-item" data-item-type={item.itemType}>
			<div className={ Classes.MENU_ITEM } label={item.key}>
				{type == "added"
					? <span className={[Classes.MENU_ITEM_LABEL, "zr-text-small", "zotero-roam-item-timestamp"].join(" ")}>
						{item.timestamp}
					</span>
					: null}
				<div className={[Classes.FILL, "zotero-roam-item-contents"].join(" ")}>
					<span className="zotero-roam-search-item-title" style={{ whiteSpace: "normal" }}>{item.title}</span>
					<span className="zr-highlight">{item.meta}</span>
					<span className="zotero-roam-list-item-key zr-text-small zr-auxiliary">[{item.key}]</span>
					{item.abstract
						? <Button className="zotero-roam-citation-toggle-abstract" onClick={toggleAbstract} intent="primary" minimal={true} small={true}>{isAbstractVisible ? "Hide" : "Show"} Abstract</Button>
						: null}
					{item.abstract && isAbstractVisible
						? <span className="zotero-roam-citation-abstract zr-text-small zr-auxiliary">{item.abstract}</span>
						: null}
				</div>
				<span className="zotero-roam-list-item-actions">
					<ButtonGroup minimal={true} className="zr-text-small">
						<Button small={true} {...buttonProps} />
					</ButtonGroup>
				</span>
			</div>
		</li>
	);
});
RelatedItem.propTypes = {
	item: PropTypes.object,
	type: PropTypes.oneOf(["tagged", "added"]),
	allAbstractsShown: PropTypes.bool,
};

function RelatedByTags(props){
	const { items, tag } = props;
	const [isShowingAllAbstracts, setShowingAllAbstracts] = useState(false);

	const toggleAbstracts = useCallback(() => {
		setShowingAllAbstracts(!isShowingAllAbstracts);
	}, [isShowingAllAbstracts]);

	const sortedItems = useMemo(() => {
		return sortItems(items, "meta");
	}, [items]);

	return (
		<>
			<h5>{pluralize(sortedItems.length, "item", ` tagged with ${tag}`)}</h5>
			<Button minimal={true} intent="primary" onClick={toggleAbstracts}>`${isShowingAllAbstracts ? "Hide" : "Show"} all abstracts`</Button>
			<ul className={ Classes.LIST_UNSTYLED }>
				{sortedItems.map(it => {
					let location = it.library.type + "s/" + it.library.id;
					return (
						<RelatedItem key={[location, it.key].join("-")} allAbstractsShown={isShowingAllAbstracts} item={it} type="tagged" />
					);
				})}
			</ul>
		</>
	);
}
RelatedByTags.propTypes ={
	items: PropTypes.array,
	tag: PropTypes.string
};

const AuxiliaryDialog = React.memo(function AuxiliaryDialog(props) {
	const {
		ariaLabelledBy,
		className: dialogClass,
		isOpen,
		items,
		onClose,
		portalTarget,
		show
	} = props;

	const dialog_class = useMemo(() => "zr-auxiliary-dialog--" + dialogClass, []);

	const dialogContents = useMemo(() => {
		let formattedItems = simplifyRelatedItems(items);
		if(show.type == "with_tag"){
			return (
				<RelatedByTags items={formattedItems} tag={show.tag} />
			);
		} else if(show.type == "added_on"){
			return (
				<RelatedByAdded items={formattedItems} date={show.date} />
			);
		} else {
			return null;
		}
	}, [show.tag, show.type, items]);

	return (
		createPortal(
			<Dialog
				ariaLabelledBy={ariaLabelledBy}
				className={dialog_class}
				isOpen={isOpen}
				lazy={true}
				usePortal={false}
				canEscapeKeyClose={true}
				canOutsideClickClose={true}
				onClose={onClose}
			>
				<div className={Classes.DIALOG_BODY}>
					{dialogContents}
				</div>
			</Dialog>,
			document.getElementById(portalTarget))
	);
});
AuxiliaryDialog.propTypes = {
	ariaLabelledBy: PropTypes.string,
	className: PropTypes.string,
	isOpen: PropTypes.bool,
	items: PropTypes.array,
	onClose: PropTypes.func,
	portalTarget: PropTypes.string,
	show: PropTypes.object
};

export default AuxiliaryDialog;
