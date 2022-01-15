import React, { useMemo, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Button, Classes, Dialog } from "@blueprintjs/core";

import "./index.css";
import { makeTimestamp, parseDOI, pluralize } from "../../utils";

/** Formats a list of items for display in AuxiliaryDialog
 * @param {Object[]} items - The list of items to format 
 * @returns {Object[]} The formatted array
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

/** Formats a list of Semantic Scholar entries for display in AuxiliaryDialog
 * @param {Object[]} items - The list of entries to format 
 * @returns {{
 * authors: String, 
 * doi: String, 
 * intent: String[], 
 * isInfluential: Boolean,
 * links: Object,
 * meta: String,
 * title: String,
 * url: String,
 * year: String
 * }[]} The formatted list, ready for rendering
 */
function simplifyRelatedSemantic(items){
	return items.map((item) => {
		let cleanItem = {
			authors: "",
			doi: parseDOI(item.doi),
			intent: item.intent,
			isInfluential: item.isInfluential,
			links: {},
			meta: item.venue.split(/ ?:/)[0], // If the publication has a colon, only take the portion that precedes it
			title: item.title,
			url: item.url || "",
			year: item.year ? item.year.toString() : ""
		};

		// Parse authors data
		cleanItem.authorsLastNames = item.authors.map(a => {
			let components = a.name.replaceAll(".", " ").split(" ").filter(Boolean);
			if(components.length == 1){
				return components[0];
			} else {
				return components.slice(1).filter(c => c.length > 1).join(" ");
			}
		});
		cleanItem.authorsString = cleanItem.authorsLastNames.join(" ");
		switch(cleanItem.authorsLastNames.length){
		case 0:
			break;
		case 1:
			cleanItem.authors = cleanItem.authorsLastNames[0];
			break;
		case 2:
			cleanItem.authors = cleanItem.authorsLastNames[0] + " & " + cleanItem.authorsLastNames[1];
			break;
		case 3:
			cleanItem.authors = cleanItem.authorsLastNames[0] + ", " + cleanItem.authorsLastNames[1] + " & " + cleanItem.authorsLastNames[2];
			break;
		default:
			cleanItem.authors = cleanItem.authorsLastNames[0] + " et al.";
		}

		// Parse external links
		if(item.paperId){
			cleanItem.links["semanticScholar"] = `https://www.semanticscholar.org/paper/${item.paperId}`;
		}
		if(item.arxivId){
			cleanItem.links["arxiv"] = `https://arxiv.org/abs/${item.arxivId}`;
		}
		if(item.doi){
			cleanItem.links["connectedPapers"] = `https://www.connectedpapers.com/api/redirect/doi/${item.doi}`;
			cleanItem.links["googleScholar"] = `https://scholar.google.com/scholar?q=${item.doi}`;
		}

		return cleanItem;
	});
}

/** Sorts a list of items, as produced by {@link simplifyRelatedItems}, on a given key, in ascending order
 * @param {Object[]} items - The list of items to sort 
 * @param {String} sort - The key to sort items on 
 * @returns {Object[]} The sorted array
 */
function sortItems(items, sort = "meta"){
	return items.sort((a,b) => (a[`${sort}`].toLowerCase() < b[`${sort}`].toLowerCase() ? -1 : 1));
}

function RelatedBy(props){
	const { items, by, sort, title, onClose, ariaLabelledBy } = props;
	const [isShowingAllAbstracts, setShowingAllAbstracts] = useState(false);

	const toggleAbstracts = useCallback(() => {
		setShowingAllAbstracts(!isShowingAllAbstracts);
	}, [isShowingAllAbstracts]);

	const sortedItems = useMemo(() => {
		return sortItems(items, sort);
	}, [items]);

	const relationship = useMemo(() => {
		switch(by){
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
	}, [by]);

	return (
		<>
			<div className="header-content">
				<div className="header-left">
					<h5 id={ariaLabelledBy} className="panel-tt">{pluralize(sortedItems.length, relationship.string, relationship.suffix)}</h5>
					<Button className={ [Classes.ACTIVE, "zr-text-small"].join(" ") } zr-role="toggle-abstracts" icon={isShowingAllAbstracts ? "eye-off" : "eye-open"} minimal={true} onClick={toggleAbstracts}>{isShowingAllAbstracts ? "Hide" : "Show"} all abstracts</Button>
				</div>
				<div className={["header-right", "zr-auxiliary"].join(" ")}>
					<Button icon="small-cross" minimal={true} onClick={onClose} />
				</div>
			</div>
			<div className="rendered-div">
				<ul className={ Classes.LIST_UNSTYLED }>
					{sortedItems.map(it => {
						return (
							<RelatedItem key={[it.location, it.key].join("-")} allAbstractsShown={isShowingAllAbstracts} item={it} type={by} />
						);
					})}
				</ul>
			</div>
		</>
	);
}
RelatedBy.propTypes = {
	items: PropTypes.array,
	by: PropTypes.oneOf(["added_on", "has_abstract", "has_tag", "is_citation", "is_reference"]),
	sort: PropTypes.oneOf(["added", "meta"]),
	title: PropTypes.string,
	onClose: PropTypes.func,
	ariaLabelledBy: PropTypes.string,
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
	allAbstractsShown: PropTypes.bool,
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
		let formattedItems = (["is_citation", "is_reference"].includes(type)) ? simplifyRelatedSemantic(items) : simplifyRelatedItems(items);
		
		let panelProps = { 
			ariaLabelledBy, 
			onClose,
			items: formattedItems,
			by: type,
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
