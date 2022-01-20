import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Classes, Icon, InputGroup, Tabs, Tab, Tag, NonIdealState } from "@blueprintjs/core";
import { QueryList } from "@blueprintjs/select";

import CitekeyPopover from "../../CitekeyPopover";
import { pluralize, sortItems } from "../../../../utils";
import * as customPropTypes from "../../../../propTypes";
import "./index.css";

const noResultsState = <NonIdealState icon="search" title="No results" />;

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

	const itemActions = useMemo(() => {
		if(!inLibrary){
			return (
				<>
					{item.url
						? <a href={item.url} target="_blank" rel="noreferrer"
							zr-role="item-url"
							className={[ Classes.TEXT_MUTED, "zr-text-small"].join(" ")} >
							{item.doi || "Semantic Scholar"}
						</a>
						: null}
					<Button text="Add to Zotero" className="zr-text-small" icon="inheritance" intent="primary" minimal={true} small={true} />
				</>
			);
		} else {
			return (
				<CitekeyPopover inGraph={inGraph} item={inLibrary} />
			);
		}
	}, [inGraph, inLibrary, item.doi, item.url]);

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
	item: customPropTypes.cleanSemanticReturnType,
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
			noResults={noResultsState}
			onQueryChange={handleQueryChange}
			query={query}
		/>
	);
});
SemanticQuery.propTypes = {
	items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType),
	type: PropTypes.oneOf(["is_citation", "is_reference"])
};

const SemanticPanel = React.memo(function SemanticPanel(props) {
	const { ariaLabelledBy, onClose, type, title, items } = props;
	const [isActiveTab, setActiveTab] = useState(type);

	const selectTab = useCallback((newtab, _prevtab, _event) => {
		setActiveTab(newtab);
	}, []);

	const references = useMemo(() =>  sortItems(items.references, "year"), [items.references]);

	const citations = useMemo(() => sortItems(items.citations, "year"), [items.citations]);

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
	items: customPropTypes.cleanSemanticReturnObjectType,
	onClose: PropTypes.func,
	portalId: PropTypes.string,
	title: PropTypes.string,
	type: PropTypes.oneOf(["is_citation", "is_reference"])
};

export default SemanticPanel;
