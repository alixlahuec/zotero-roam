import React, { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Button, Classes, Dialog, InputGroup, Tabs, Tab, Icon } from "@blueprintjs/core";

import "./index.css";
import { makeTimestamp, pluralize } from "../../utils";
import { getCitekeyPages } from "../../roam";
import { QueryList } from "@blueprintjs/select";

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

function searchEngine(query, items){
	return items
		.filter(it => it.title.toLowerCase().includes(query.toLowerCase()));
}

function listItemRenderer(item, _itemProps, type) {
	// let { handleClick, modifiers, query } = itemProps;

	return <RelatedSemantic key={item.doi} item={item} type={type} inGraph={item.inGraph} />;
}

const RelatedBy = React.memo(function RelatedBy(props) {
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
		}
	}, [type]);

	const roamCitekeys = getCitekeyPages();

	return (
		<>
			<div className="header-content">
				<div className="header-left">
					<h5 id={ariaLabelledBy} className="panel-tt">{pluralize(sortedItems.length, relationship.string, relationship.suffix)}</h5>
					<Button className={[Classes.ACTIVE, "zr-text-small"].join(" ")} zr-role="toggle-abstracts" icon={isShowingAllAbstracts ? "eye-off" : "eye-open"} minimal={true} onClick={toggleAbstracts}>{isShowingAllAbstracts ? "Hide" : "Show"} all abstracts</Button>
				</div>
				<div className={["header-right", "zr-auxiliary"].join(" ")}>
					<Button icon="small-cross" minimal={true} onClick={onClose} />
				</div>
			</div>
			<div className="rendered-div">
				<ul className={Classes.LIST_UNSTYLED}>
					{sortedItems.map(it => {
						let inGraph = roamCitekeys.has("@" + it.key) ? roamCitekeys.get("@" + it.key) : false;
						return (
							<RelatedItem key={[it.location, it.key].join("-")} inGraph={inGraph} allAbstractsShown={isShowingAllAbstracts} item={it} type={type} />
						);
					})
					}
				</ul>
			</div>
		</>
	);
});
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
							{item.url && !inLibrary
								? <a href={item.url} target="_blank" rel="noreferrer"
									zr-role="item-url"
									className={[ Classes.TEXT_MUTED, "zr-text-small"].join(" ")} 
								>{item.doi || "Semantic Scholar"}</a>
								: null}
							{inGraph
								? <Button icon="symbol-circle" intent="success" className="zr-text-small" minimal={true} small={true} text="Go to Roam page" />
								: inLibrary
									? <Button icon="plus" className="zr-text-small" minimal={true} small={true} text={"@" + inLibrary.key} />
									: <Button icon="inheritance" intent="primary" className="zr-text-small" minimal={true} small={true} text="Add to Zotero" />}
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

const SemanticQuery = React.memo(function SemanticQuery(props) {
	const { items, type } = props;
	const [query, setQuery] = useState();
	const searchbar = useRef();

	const defaultContent = useMemo(() => {
		return items.map(it => <RelatedSemantic key={it.doi} item={it} type={type} inGraph={it.inGraph} />);
	}, [items, type]);

	const handleQueryChange = useCallback((query) => {
		setQuery(query);
		// debounce
	}, []);

	const itemRenderer = useCallback((item, itemProps) => {
		return listItemRenderer(item, itemProps, type);
	}, [type]);

	function listRenderer(listProps) {
		let { handleKeyDown, handleKeyUp, handleQueryChange } = listProps;

		return (
			<div className="rendered-div">
				<InputGroup
					id={"semantic-search--" + type}
					leftIcon="search"
					placeholder="Search by title"
					spellCheck="false"
					autoComplete="off"
					onChange={handleQueryChange}
					onKeyDown={handleKeyDown}
					onKeyUp={handleKeyUp}
					inputRef={searchbar}
				/>
				{listProps.itemList}
			</div>
		);
	}

	return(
		<QueryList 
			initialContent={defaultContent}
			items={items}
			itemListPredicate={searchEngine}
			renderer={listRenderer}
			itemRenderer={itemRenderer}
			onQueryChange={handleQueryChange}
			query={query}
		/>
	);
});
SemanticQuery.propTypes = {
	items: PropTypes.arrayOf(PropTypes.object),
	type: PropTypes.oneOf(["is_citation", "is_reference"])
};

const SemanticPanel = React.memo(function SemanticPanel(props) {
	const { ariaLabelledBy, onClose, type, title, items } = props;
	const [isActiveTab, setActiveTab] = useState(type);
	const roamCitekeys = getCitekeyPages();

	const selectTab = useCallback((newtab, _prevtab, _event) => {
		setActiveTab(newtab);
	}, []);

	const references = useMemo(() => {
		return items.references.map(it => {
			let inGraph = it.inLibrary && roamCitekeys.has("@" + it.inLibrary.key) ? roamCitekeys.get("@" + it.inLibrary.key) : false;
			return {
				...it,
				inGraph
			};
		});
	}, [roamCitekeys, items.references]);

	const citations = useMemo(() => {
		return items.citations.map(it => {
			let inGraph = it.inLibrary && roamCitekeys.has("@" + it.inLibrary.key) ? roamCitekeys.get("@" + it.inLibrary.key) : false;
			return {
				...it,
				inGraph
			};
		});
	}, [roamCitekeys, items.citations]);

	const references_title = useMemo(() => {
		return (
			<>
				<Icon icon="citation" intent="primary" />
				<span className={ Classes.TEXT }>{pluralize(references.length, "reference")}</span>
			</>
		);
	}, [references.length]);

	const citations_title = useMemo(() => {
		return (
			<>
				<Icon icon="chat" intent="warning" />
				<span>{pluralize(citations.length, "citing paper")}</span>
			</>
		);
	}, [citations.length]);

	return (
		<>
			<Tabs id="zr-semantic-panel" SelectedTabId={isActiveTab} onChange={selectTab}>
				<Tab id="is_reference" 
					panel={<SemanticQuery
						items={references}
						type="is_reference"
					/>} 
					disabled={references.length == 0}
					title={references_title}
				/>
				<Tab id="is_citation" 
					panel={<SemanticQuery
						items={citations}
						type="is_citation"
					/>}
					disabled={citations.length == 0}
					title={citations_title}
				/>
				<Tabs.Expander />
				<h5 className="panel-tt" id={ariaLabelledBy}>{title}</h5>
				<Button icon="cross" minimal={true} onClick={onClose} />
			</Tabs>
		</>
	);
});
SemanticPanel.propTypes = {
	ariaLabelledBy: PropTypes.string,
	items: PropTypes.arrayOf(PropTypes.object),
	onClose: PropTypes.func,
	title: PropTypes.string,
	type: PropTypes.oneOf(["is_citation", "is_reference"])
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
		let panelProps = { 
			ariaLabelledBy, 
			onClose,
			type,
			title: title
		};

		if(["is_citation", "is_reference"].includes(type)){
			let semanticProps = {
				panelProps,
				items
			};
			return (
				<SemanticPanel {...semanticProps} />
			);
		} else {
			let relatedProps = {
				panelProps,
				items: simplifyRelatedItems(items),
				sort: type == "added_on" ? "added" : "meta"
			};
			return (
				<RelatedBy {...relatedProps} />
			);
		}
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
