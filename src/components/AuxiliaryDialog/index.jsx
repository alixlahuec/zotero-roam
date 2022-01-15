import React, { useMemo, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Button, Classes, Dialog } from "@blueprintjs/core";

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
			location: item.library.type + "s/" + item.library.id,
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
		return makeDNP(date, {brackets: false});
	}, [date]);

	const sortedItems = useMemo(() => {
		return sortItems(items, "added");
	}, [items]);

	return (
		<>
			<h5>{pluralize(sortedItems.length, "item", ` added on ${dnp}`)}</h5>
			<ul className={ Classes.LIST_UNSTYLED }>
				{sortedItems.map(it => {
					return (
						<RelatedItem key={[it.location, it.key].join("-")} item={it} type="added" />
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
				"data-citekey": item.key,
				"data-uid": item.inGraph,
				text: "Go to @" + item.key
			};
		} else {
			return {
				icon: "plus",
				text: "@" + item.key
			};
		}
	}, [item.inGraph]);

	useEffect(() => {
		setAbstractVisible(allAbstractsShown);
	}, [allAbstractsShown]);

	return (
		<li className="zotero-roam-list-item" data-item-type={item.itemType}>
			<div className={ Classes.MENU_ITEM } label={item.key}>
				{type == "added"
					? <span className={[Classes.MENU_ITEM_LABEL, "zr-text-small", "zotero-roam-item-timestamp"].join(" ")}>
						{item.timestamp}
					</span>
					: null}
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL }>
						<div className="zr-related-item-contents--metadata">
							<span className="zotero-roam-search-item-title" style={{ whiteSpace: "normal" }}>{item.title}</span>
							<span className="zr-highlight">{item.meta}</span>
						</div>
						<span className="zr-related-item-contents--actions">
							<Button className="zr-text-small" minimal={true} small={true} {...buttonProps} />
						</span>
					</div>
					<div className={ Classes.FILL }>
						{item.abstract
							? <Button className={ Classes.ACTIVE }
								zr-role="toggle-abstract"
								icon={isAbstractVisible ? "chevron-down" : "chevron-right"}
								onClick={toggleAbstract} 
								intent="primary" 
								minimal={true} 
								small={true}>Abstract</Button>
							: null}
						{item.abstract && isAbstractVisible
							? <span className="zotero-roam-citation-abstract zr-text-small zr-auxiliary">{item.abstract}</span>
							: null}
					</div>
				</div>
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
			<Button className={ [Classes.ACTIVE, "zr-text-small"].join(" ") } zr-role="toggle-abstracts" icon={isShowingAllAbstracts ? "eye-off" : "eye-open"} minimal={true} onClick={toggleAbstracts}>{isShowingAllAbstracts ? "Hide" : "Show"} all abstracts</Button>
			<ul className={ Classes.LIST_UNSTYLED }>
				{sortedItems.map(it => {
					return (
						<RelatedItem key={[it.location, it.key].join("-")} allAbstractsShown={isShowingAllAbstracts} item={it} type="tagged" />
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
