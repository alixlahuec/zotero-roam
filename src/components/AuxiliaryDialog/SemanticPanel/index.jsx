import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Classes, Icon, InputGroup, Tabs, Tab, Tag, Menu, MenuItem } from "@blueprintjs/core";
import { QueryList } from "@blueprintjs/select";
import { Popover2 } from "@blueprintjs/popover2";

import { getCitekeyPages, openInSidebarByUID, openPageByUID } from "../../../roam";
import { pluralize, sortItems } from "../../../utils";
import "./index.css";

function searchEngine(query, items){
	return items
		.filter(it => it.title.toLowerCase().includes(query.toLowerCase()));
}

function listItemRenderer(item, _itemProps, type) {
	// let { handleClick, modifiers, query } = itemProps;

	return <SemanticItem key={item.doi} item={item} type={type} inGraph={item.inGraph} />;
}

const SemanticItem = React.memo(function SemanticItem(props) {
	const { item, type, inGraph } = props;
	const { inLibrary } = item;

	const popoverMenuProps = useMemo(() => {
		return {
			interactionKind: "hover",
			placement: "right-start",
			lazy: true
		};
	}, []);

	const actionsMenu = useMemo(() => {
		if(!inLibrary){
			return null;
		} else if(!inGraph){
			return (
				<Menu>
					<MenuItem className="zr-text-small" icon="add" text="Import metadata" />
					<MenuItem className="zr-text-small" icon="inheritance" text="Import & open in sidebar" />
				</Menu>
			);
		} else {
			return (
				<Menu>
					<MenuItem className="zr-text-small" 
						icon="arrow-right" 
						text="Go to Roam page"
						onClick={() => openPageByUID(inGraph)} />
					<MenuItem className="zr-text-small" 
						icon="inheritance" 
						text="Open in sidebar"
						onClick={() => openInSidebarByUID(inGraph)} />
				</Menu>
			);
		}
	}, [item, inLibrary, inGraph]);

	const itemActions = useMemo(() => {
		if(!inLibrary){
			return (
				<Button text="Add to Zotero" className="zr-text-small" icon="inheritance" intent="primary" minimal={true} small={true} />
			);
		} else {
			let buttonProps = inGraph
				? {intent: "success", onClick: () => openPageByUID(inGraph)}
				: {};
			return (
				<Popover2 {...popoverMenuProps} content={actionsMenu}>
					<Button text={"@" + inLibrary.key} className="zr-text-small" rightIcon="chevron-right" minimal={true} small={true} {...buttonProps} />
				</Popover2>
			);
		}
	}, [inGraph, inLibrary, popoverMenuProps, actionsMenu]);

	return (
		<li className="zr-related-item" data-semantic-type={type} data-in-library={inLibrary != false} data-in-graph={inGraph != false}>
			<div className={ Classes.MENU_ITEM } label={item.doi}>
				<span className={[Classes.MENU_ITEM_LABEL, "zr-text-small", "zr-related-item--timestamp"].join(" ")}>
					{item.year}
				</span>
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{display: "flex"}}>
						<div className="zr-related-item-contents--metadata">
							<span className={type == "is_reference" ? "zr-highlight" : "zr-highlight-2"}>{item.authors}</span>
							<span className="zr-secondary">{item.meta}</span>
							{item.isInfluential
								? <Icon icon="trending-up" color="#f8c63a" htmlTitle="This item was classified as influential by Semantic Scholar" />
								: null}
							<span className="zotero-roam-search-item-title" style={{ whiteSpace: "normal" }}>{item.title}</span>
							<div className="zr-related-item--links">
								{Object.keys(item.links).map((key) => {
									return (
										<span key={key} data-service={key}>
											<a href={item.links[key]} className="zr-text-small" target="_blank" rel="noreferrer">{key.split("-").map(key => key.charAt(0).toUpperCase() + key.slice(1)).join(" ")}</a>
										</span>
									);
								})}
							</div>
						</div>
						<span className="zr-related-item-contents--actions">
							{item.url && !inLibrary
								? <a href={item.url} target="_blank" rel="noreferrer"
									zr-role="item-url"
									className={[ Classes.TEXT_MUTED, "zr-text-small"].join(" ")} 
								>{item.doi || "Semantic Scholar"}</a>
								: null}
							{itemActions}
						</span>
					</div>
					<div className="zr-related-item--intents">
						{item.intent.length > 0
							? item.intent.map(int => <Tag key={int} data-semantic-intent={int} minimal={true}>{int.charAt(0).toUpperCase() + int.slice(1)}</Tag>)
							: null}
					</div>
				</div>
			</div>
		</li>
	);
});
SemanticItem.propTypes = {
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
		return items.map(it => <SemanticItem key={it.doi} item={it} type={type} inGraph={it.inGraph} />);
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
		return sortItems(items.references, "year")
			.map(it => {
				let inGraph = it.inLibrary && roamCitekeys.has("@" + it.inLibrary.key) ? roamCitekeys.get("@" + it.inLibrary.key) : false;
				return {
					...it,
					inGraph
				};
			});
	}, [roamCitekeys, items.references]);

	const citations = useMemo(() => {
		return sortItems(items.citations, "year")
			.map(it => {
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
				<Icon icon="citation" />
				<span>{pluralize(references.length, "reference")}</span>
			</>
		);
	}, [references.length]);

	const citations_title = useMemo(() => {
		return (
			<>
				<Icon icon="chat" />
				<span>{pluralize(citations.length, "citing paper")}</span>
			</>
		);
	}, [citations.length]);

	useEffect(() => {
		setActiveTab(type);
	}, [type]);

	return (
		<div className="zr-semantic-panel--main">
			<Tabs id="zr-semantic-panel" selectedTabId={isActiveTab} onChange={selectTab} animate={false}>
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
				<span className="zr-auxiliary" id={ariaLabelledBy}>{title}</span>
				<Button icon="cross" minimal={true} large={true} onClick={onClose} />
			</Tabs>
		</div>
	);
});
SemanticPanel.propTypes = {
	ariaLabelledBy: PropTypes.string,
	items: PropTypes.arrayOf(PropTypes.object),
	onClose: PropTypes.func,
	portalId: PropTypes.string,
	title: PropTypes.string,
	type: PropTypes.oneOf(["is_citation", "is_reference"])
};

export default SemanticPanel;
