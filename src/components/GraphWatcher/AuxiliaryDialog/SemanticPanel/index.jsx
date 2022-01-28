import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, ButtonGroup, Classes, Icon, InputGroup, Tabs, Tab, Tag, NonIdealState } from "@blueprintjs/core";
import { QueryList } from "@blueprintjs/select";

import CitekeyPopover from "../../CitekeyPopover";
import { pluralize, sortItems } from "../../../../utils";
import * as customPropTypes from "../../../../propTypes";
import "./index.css";

const noResultsState = <NonIdealState className="zr-auxiliary" description="No results found" />;

function searchEngine(query, items){
	return items
		.filter(it => it.title.toLowerCase().includes(query.toLowerCase()));
}

function listItemRenderer(item, _itemProps, metadataSettings, selectProps, type) {
	// let { handleClick, modifiers, query } = itemProps;
	let { handleRemove, handleSelect, items } = selectProps;
	let isSelected = items.findIndex(i => i.doi == item.doi || i.url == item.url) >= 0;

	return <SemanticItem key={item.doi} 
		handleRemove={handleRemove} 
		handleSelect={handleSelect} 
		inGraph={item.inGraph} 
		isSelected={isSelected}
		item={item} 
		metadataSettings={metadataSettings} 
		type={type} />;
}

const SemanticItem = React.memo(function SemanticItem(props) {
	const { handleRemove, handleSelect, inGraph, isSelected, item, metadataSettings, type } = props;
	const { inLibrary } = item;

	const handleClick = useCallback(() => {
		// For debugging
		console.log(props);
		if(isSelected){
			handleRemove(item);
		} else {
			handleSelect(item);
		}
	}, [isSelected, item, handleRemove, handleSelect, props]);

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
					<Button text="Add to Zotero" 
						active={isSelected}
						className="zr-text-small" 
						icon={isSelected ? "small-cross" : "small-plus"} 
						intent="primary" 
						minimal={true} 
						onClick={handleClick}
						small={true} />
				</>
			);
		} else {
			let { children: { pdfs, notes }, raw} = inLibrary;
			return (
				<CitekeyPopover inGraph={inGraph} item={raw} metadataSettings={metadataSettings} notes={notes} pdfs={pdfs} />
			);
		}
	}, [handleClick, inGraph, inLibrary, isSelected, item.doi, item.url, metadataSettings]);

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
								? <Icon className="zr-related-item--decorating-icon" color="#f8c63a" htmlTitle="This item was classified as influential by Semantic Scholar" icon="trending-up" />
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
							? item.intent.map(int => {
								let capitalizedIntent = int.charAt(0).toUpperCase() + int.slice(1);
								return <Tag key={int} data-semantic-intent={int} htmlTitle={"This citation was classified as related to " + capitalizedIntent + " by Semantic Scholar"} minimal={true}>{capitalizedIntent}</Tag>;})
							: null}
					</div>
				</div>
			</div>
		</li>
	);
});
SemanticItem.propTypes = {
	handleRemove: PropTypes.func,
	handleSelect: PropTypes.func,
	inGraph: PropTypes.oneOf([PropTypes.string, false]),
	isSelected: PropTypes.bool,
	item: customPropTypes.cleanSemanticReturnType,
	metadataSettings: PropTypes.object,
	type: PropTypes.oneOf(["is_reference", "is_citation"])
};

const SemanticQuery = React.memo(function SemanticQuery(props) {
	const { items, metadataSettings, selectProps, type } = props;
	const [query, setQuery] = useState();
	const searchbar = useRef();

	const defaultContent = useMemo(() => {
		return items.map(it => <SemanticItem key={it.doi} inGraph={it.inGraph} item={it} metadataSettings={metadataSettings} type={type} />);
	}, [items, metadataSettings, type]);

	const handleQueryChange = useCallback((query) => {
		setQuery(query);
		// debounce
	}, []);

	const itemRenderer = useCallback((item, itemProps) => {
		return listItemRenderer(item, itemProps, metadataSettings, selectProps, type);
	}, [metadataSettings, selectProps, type]);

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
	metadataSettings: PropTypes.object,
	selectProps: PropTypes.shape({
		handleRemove: PropTypes.func,
		handleSelect: PropTypes.func,
		items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType)
	}),
	type: PropTypes.oneOf(["is_citation", "is_reference"])
};

const SidePanel = React.memo(function SidePanel(props) {
	const { items } = props;

	if(items.length == 0) {
		return null;
	} else {
		return (
			<div className="zr-semantic-panel--side">
				<ul className={[Classes.LIST_UNSTYLED, "import-items"].join(" ")}>
					{items.map(item => {
						return (
							<li className="import-items_selected" key={[item.doi, item.url].join("-")}>
								<div className="selected_info">
									<span className={[Classes.TEXT_MUTED, "selected_title"].join(" ")}>{item.title}</span>
									<span className="selected_origin">{item.meta}</span>
								</div>
								<div className="selected_state">
									<ButtonGroup minimal={true} small={true}>
										<Button className="selected_remove-button" icon="cross" intent="danger" />
									</ButtonGroup>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		);
	}
});
SidePanel.propTypes = {
	items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType)
};

const SemanticPanel = React.memo(function SemanticPanel(props) {
	const { ariaLabelledBy, items, metadataSettings, type, title, onClose } = props;
	const [isActiveTab, setActiveTab] = useState(type);
	const [itemsForImport, setItemsForImport] = useState([]);

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

	const addToImport = useCallback((item) => {
		setItemsForImport(prevItems => {
			let match = prevItems.find(i => i.doi == item.doi && i.url == item.url);
			if(match){
				return prevItems;
			} else {
				return [...prevItems, item];
			}
		});
	}, []);

	const removeFromImport = useCallback((item) => {
		setItemsForImport(prevItems => prevItems.filter(i => i.doi != item.doi && i.url != item.url));
	}, []);

	const selectProps = useMemo(() => {
		return {
			handleRemove: removeFromImport,
			handleSelect: addToImport,
			items: itemsForImport
		};
	}, [addToImport, itemsForImport, removeFromImport]);

	useEffect(() => {
		setActiveTab(type);
		console.log(selectProps);
	}, [selectProps, type]);

	return (
		<>
			<div className="zr-semantic-panel--main">
				<Tabs id="zr-semantic-panel" selectedTabId={isActiveTab} onChange={selectTab} animate={false}>
					<Tab id="is_reference" 
						panel={<SemanticQuery
							items={references}
							metadataSettings={metadataSettings}
							selectProps={selectProps}
							type="is_reference"
						/>} 
						disabled={references.length == 0}
						title={references_title}
					/>
					<Tab id="is_citation" 
						panel={<SemanticQuery
							items={citations}
							metadataSettings={metadataSettings}
							selectProps={selectProps}
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
			<SidePanel items={itemsForImport} />
		</>
	);
});
SemanticPanel.propTypes = {
	ariaLabelledBy: PropTypes.string,
	items: customPropTypes.cleanSemanticReturnObjectType,
	metadataSettings: PropTypes.object,
	onClose: PropTypes.func,
	portalId: PropTypes.string,
	title: PropTypes.string,
	type: PropTypes.oneOf(["is_citation", "is_reference"])
};

export default SemanticPanel;
