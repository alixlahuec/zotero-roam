import React, { useCallback, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { InputGroup, NonIdealState } from "@blueprintjs/core";
import { QueryList } from "@blueprintjs/select";

import SemanticItem from "./SemanticItem";
import { searchEngine } from "../../../utils";

import * as customPropTypes from "../../../propTypes";

const noResultsState = <NonIdealState className="zr-auxiliary" description="No results found" />;

function itemListPredicate(query, items){
	return items.filter(it => searchEngine(
		query, 
		it._multiField,
		{
			any_case: true, 
			match: "partial", 
			search_compounds: true, 
			word_order: "loose"
		}
	));
}

function listItemRenderer(item, _itemProps, metadataSettings, selectProps, type, updateRoamCitekeys) {
	// let { handleClick, modifiers, query } = itemProps;
	let { handleRemove, handleSelect, items: selectedItems } = selectProps;
	let isSelected = selectedItems.findIndex(i => i.doi == item.doi || i.url == item.url) >= 0;

	return <SemanticItem key={item.doi} 
		handleRemove={handleRemove} 
		handleSelect={handleSelect} 
		inGraph={item.inGraph} 
		isSelected={isSelected}
		item={item} 
		metadataSettings={metadataSettings} 
		type={type}
		updateRoamCitekeys={updateRoamCitekeys} />;
}

const SemanticQuery = React.memo(function SemanticQuery(props) {
	const { items, metadataSettings, selectProps, type, updateRoamCitekeys } = props;

	const [query, setQuery] = useState();
	const searchbar = useRef();

	const defaultContent = useMemo(() => {
		const { handleRemove, handleSelect, items: selectedItems } = selectProps;
		return items.map(it => {
			let isSelected = selectedItems.findIndex(i => i.doi == it.doi && i.url == it.url) >= 0;
			return <SemanticItem key={it.doi} 
				handleRemove={handleRemove} 
				handleSelect={handleSelect} 
				inGraph={it.inGraph} 
				isSelected={isSelected}
				item={it} 
				metadataSettings={metadataSettings} 
				type={type}
				updateRoamCitekeys={updateRoamCitekeys} />;
		});
	}, [items, metadataSettings, selectProps, type, updateRoamCitekeys]);

	const handleQueryChange = useCallback((query) => {
		setQuery(query);
		// debounce
	}, []);

	const itemRenderer = useCallback((item, itemProps) => {
		return listItemRenderer(item, itemProps, metadataSettings, selectProps, type, updateRoamCitekeys);
	}, [metadataSettings, selectProps, type, updateRoamCitekeys]);

	function listRenderer(listProps) {
		let { handleKeyDown, handleKeyUp, handleQueryChange } = listProps;

		return (
			<div className="rendered-div">
				<InputGroup
					id={"semantic-search--" + type}
					leftIcon="search"
					placeholder="Search by title, authors (last names), or year"
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
			itemListPredicate={itemListPredicate}
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
		items: PropTypes.arrayOf(customPropTypes.cleanSemanticReturnType),
		resetImport: PropTypes.func
	}),
	type: PropTypes.oneOf(["is_citation", "is_reference"]),
	updateRoamCitekeys: PropTypes.func
};

export default SemanticQuery;
