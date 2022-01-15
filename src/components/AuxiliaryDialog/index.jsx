import React, { useMemo, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Button, Classes, Dialog } from "@blueprintjs/core";

import "./index.css";
import { makeTimestamp, pluralize } from "../../utils";
import { getCitekeyPages } from "../../roam";

/** Formats a list of items for display in AuxiliaryDialog
 * @param {Object[]} items - The list of items to format 
 * @returns {{
 * abstract: String,
 * added: Date,
 * inGraph: Boolean,
 * itemType: String,
 * key: String,
 * location: String,
 * meta: String,
 * timestamp: String,
 * title: String
 * }[]} The formatted array
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

/** Sorts an array of objects on a given string key, in ascending order
 * @param {Object[]} items - The list of items to sort 
 * @param {String} sort - The key to sort items on 
 * @returns {Object[]} The sorted array
 */
function sortItems(items, sort = "meta"){
	return items.sort((a,b) => (a[`${sort}`].toLowerCase() < b[`${sort}`].toLowerCase() ? -1 : 1));
}

function RelatedBy(props){
	const { items, type, sort, title, onClose, ariaLabelledBy } = props;
	const [isShowingAllAbstracts, setShowingAllAbstracts] = useState(false);

	const toggleAbstracts = useCallback(() => {
		setShowingAllAbstracts(!isShowingAllAbstracts);
	}, [isShowingAllAbstracts]);

	const sortedItems = useMemo(() => {
		return sortItems(items, sort);
	}, [items]);

	const relationship = useMemo(() => {
		switch(type){
		case "added_on":
			return {
				string: "item",
				suffix: " added on " + title
			};
		case "has_abstract":
			return {
				string: "abstract",
				suffix: " containing " + title
			};
		case "has_tag":
			return {
				string: "item",
				suffix: " tagged with " + title
			};
		case "is_citation":
			return {
				string: "item",
				suffix: " citing " + title
			};
		case "is_reference":
			return {
				string: "item",
				suffix: " referenced by " + title
			};
		}
	}, [type]);

	const roamCitekeys = getCitekeyPages();

	return (
		<>
			<div className="header-content">
				<div className="header-left">
					<h5 id={ariaLabelledBy} className="panel-tt">{pluralize(sortedItems.length, relationship.string, relationship.suffix)}</h5>
					{["added_on", "has_abstract", "has_tag"].includes(type)
						? <Button className={ [Classes.ACTIVE, "zr-text-small"].join(" ") } zr-role="toggle-abstracts" icon={isShowingAllAbstracts ? "eye-off" : "eye-open"} minimal={true} onClick={toggleAbstracts}>{isShowingAllAbstracts ? "Hide" : "Show"} all abstracts</Button>
						: null}
				</div>
				<div className={["header-right", "zr-auxiliary"].join(" ")}>
					<Button icon="small-cross" minimal={true} onClick={onClose} />
				</div>
			</div>
			<div className="rendered-div">
				<ul className={ Classes.LIST_UNSTYLED }>
					{["added_on", "has_abstract", "has_tag"].includes(type)
						? sortedItems.map(it => {
							let inGraph = roamCitekeys.has("@" + it.key) ? roamCitekeys.get("@" + it.key) : false;
							return (
								<RelatedItem key={[it.location, it.key].join("-")} inGraph={inGraph} allAbstractsShown={isShowingAllAbstracts} item={it} type={type} />
							);})
						: sortedItems.map(it => {
							let inGraph = it.inLibrary && roamCitekeys.has("@" + it.inLibrary.key) ? roamCitekeys.get("@" + it.inLibrary.key) : false;
							return (
								<RelatedSemantic key={it.doi} item={it} type={type} inGraph={inGraph} />
							);
						})
					}
				</ul>
			</div>
		</>
	);
}
RelatedBy.propTypes = {
	items: PropTypes.array,
	type: PropTypes.oneOf(["added_on", "has_abstract", "has_tag", "is_citation", "is_reference"]),
	sort: PropTypes.oneOf(["added", "meta"]),
	title: PropTypes.string,
	onClose: PropTypes.func,
	ariaLabelledBy: PropTypes.string,
};

const RelatedItem = React.memo(function RelatedItem(props) {
	const { item, type, inGraph, allAbstractsShown } = props;
	const [isAbstractVisible, setAbstractVisible] = useState(allAbstractsShown);

	const toggleAbstract = useCallback(() => {
		setAbstractVisible(!isAbstractVisible);
	}, [isAbstractVisible]);

	const buttonProps = useMemo(() => {
		if(inGraph){
			return {
				icon: "symbol-circle",
				intent: "success",
				"data-citekey": item.key,
				"data-uid": inGraph,
				text: "Go to @" + item.key
			};
		} else {
			return {
				icon: "plus",
				text: "@" + item.key
			};
		}
	}, [inGraph]);

	useEffect(() => {
		setAbstractVisible(allAbstractsShown);
	}, [allAbstractsShown]);

	return (
		<li className="zr-related-item" data-item-type={item.itemType}>
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
							<Button className="zr-text-small" minimal={true} small={true} {...buttonProps} />
						</span>
					</div>
					<div className="zr-related-item--abstract">
						{item.abstract
							? <Button className={ [Classes.ACTIVE, "zr-text-small"].join(" ") }
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
	item: PropTypes.object,
	type: PropTypes.oneOf(["added_on", "has_abstract", "has_tag", "is_citation", "is_reference"]),
	inGraph: PropTypes.oneOf([PropTypes.string, false]),
	allAbstractsShown: PropTypes.bool,
};

const RelatedSemantic = React.memo(function RelatedSemantic(props) {
	const { item, type, inGraph } = props;
	const { inLibrary } = item;

	return (
		<li className="zr-related-item" data-semantic-type={type}>
			<div className={ Classes.MENU_ITEM } label={item.doi}>
				<span className={[Classes.MENU_ITEM_LABEL, "zr-text-small", "zr-related-item--timestamp"].join(" ")}>
					{item.year}
				</span>
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{display: "flex"}}>
						<div className="zr-related-item-contents--metadata">
							<span className="zr-highlight">{item.authors}</span>
							<span className="zr-secondary">{item.meta}</span>
							<span className="zotero-roam-search-item-title" style={{ whiteSpace: "normal" }}>{item.title}</span>
						</div>
						<span className="zr-related-item-contents--actions">
							{item.url
								? <a href={item.url} target="_blank" rel="noreferrer"
									className={[ Classes.TEXT_MUTED, "zr-text-small", "zotero-roam-citation-identifier-link"].join("")} 
								>{item.doi || "Semantic Scholar"}</a>
								: null}
							{inGraph
								? <Button icon="symbol-circle" intent="success" className="zr-text-small" minimal={true} small={true} text="Go to page" />
								: inLibrary
									? <Button icon="plus" className="zr-text-small" minimal={true} small={true} text={"@" + inLibrary.key} />
									: <Button icon="inheritance" intent="primary" className={["zotero-roam-citation-add-import", "zr-text-small"].join(" ")} minimal={true} small={true} text="Add to Zotero" />}
						</span>
					</div>
				</div>
			</div>
		</li>
	);
});
RelatedSemantic.propTypes = {
	type: PropTypes.oneOf(["is_reference", "is_citation"]),
	item: PropTypes.shape({
		authors: PropTypes.string, 
		doi: PropTypes.string,
		intent: PropTypes.arrayOf(PropTypes.string),
		isInfluential: PropTypes.bool,
		links: PropTypes.object,
		meta: PropTypes.string,
		title: PropTypes.string,
		url: PropTypes.string,
		year: PropTypes.string,
		_type: PropTypes.oneOf(["cited", "citing"]),
		inLibrary: PropTypes.oneOf([PropTypes.object, false])
	}),
	inGraph: PropTypes.oneOf([PropTypes.string, false])
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
		let { title, type } = show;
		let formattedItems = (["is_citation", "is_reference"].includes(type)) ? items : simplifyRelatedItems(items);
		
		let panelProps = { 
			ariaLabelledBy, 
			onClose,
			items: formattedItems,
			type,
			title: title,
			sort: (["is_citation", "is_reference"].includes(type)) ? "year" : type == "added_on" ? "added" : "meta"
		};

		return (
			<RelatedBy {...panelProps} />
		);
	}, [show.type, show.title, items, onClose]);

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
	show: PropTypes.shape({
		title: PropTypes.string,
		type: PropTypes.oneOf(["added_on", "has_abstract", "has_tag", "is_citation", "is_reference"])
	})
};

export default AuxiliaryDialog;
