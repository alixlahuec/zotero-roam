import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { bool, func, node, object, shape } from "prop-types";
import { MenuItem } from "@blueprintjs/core";
import { QueryList } from "@blueprintjs/select";

import { UserSettings } from "../App";
import ItemDetails from "../ItemDetails";
import SearchInputGroup from "./SearchInputGroup";
import { formatItemReferenceForCopy } from "./utils";
import { copyToClipboard, searchEngine } from "../../utils";

import { resultClass, resultKeyClass } from "./classes";
import * as customPropTypes from "../../propTypes";

const query_debounce = 300;
const query_threshold = 0;
const results_limit = 50;

// Debouncing query : https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
function useDebounceCallback(callback, timeout) {
	let timeoutRef = useRef(undefined);

	const cancel = function() {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	};

	const debounceCallback = useCallback(
		value => {
			cancel();
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null;
				callback(value);
			}, timeout);
		},
		[callback, timeout]
	);

	return [debounceCallback, cancel];
}

function itemListPredicate(query, items) {
	if(query.length < query_threshold){
		return [];
	} else {
		let matches = [];

		for(let i = 0; matches.length < results_limit && i < items.length;i++){
			let item = items[i];
			if(searchEngine(
				query, 
				[item.key, item._multiField],
				{ 
					any_case: true, 
					match: "partial", 
					search_compounds: true, 
					word_order: "loose"
				}
			)){
				matches.push(item);
			}
		}
  
		return matches;
	}
}

function listItemRenderer(item, itemProps) {
	let { handleClick, modifiers /*, query*/ } = itemProps;
	let elemKey = [item.location, item.key].join("-");

	return <SearchResult key={elemKey}
		handleClick={handleClick}
		item={item}
		modifiers={modifiers}
	/>;
}

function testItemsEquality(a,b){
	return (a.itemKey == b.itemKey && a.location == b.location);
}

const SearchResult = React.memo(function SearchResult(props) {
	const { item, handleClick, modifiers } = props;
	const { authors, inGraph, itemType, key, publication, title, year} = item;

	return <MenuItem
		onClick={handleClick}
		className="zotero-roam-search_result"
		role="option"
		aria-selected={modifiers.active}
		data-item-type={itemType}
		data-in-graph={(inGraph != false).toString()}
		labelElement={"@" + key}
		labelClassName={resultKeyClass}
		tagName="div"
		text={
			<>
				<span className="zr-item-title">{title}</span>
				<span className="zr-details">
					<span className="zr-highlight">{authors + " (" + year + ")"}</span>
					<span className="zr-secondary">{publication}</span>
				</span>
			</>
		}
		textClassName={resultClass}
	/>;
});
SearchResult.propTypes = {
	item: customPropTypes.cleanLibraryItemType,
	handleClick: func,
	modifiers: object
};

const RenderedList = React.memo(function RenderedList(props){
	const { handleClose, /*handleKeyDown, handleKeyUp,*/ itemList, selectedItem } = props;

	return selectedItem 
		? <ItemDetails item={selectedItem} 
			closeDialog={handleClose} />
		: <div id="zotero-roam-library-rendered" >
			{itemList}
		</div>;
});
RenderedList.propTypes = {
	handleClose: func,
	handleKeyDown: func,
	handleKeyUp: func,
	itemList: node,
	selectedItem: customPropTypes.cleanLibraryItemType
};

const LibraryQueryList = React.memo(function LibraryQueryList(props) {
	const { handleClose, isOpen, items, quickCopyProps } = props;
	const { copy: copySettings } = useContext(UserSettings);

	const searchbar = useRef();
	let [selectedItemID, itemSelect] = useState(null);
	let [query, setQuery] = useState();
	// Debouncing query : https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
	const [debouncedCallback, ] = useDebounceCallback(_query => { }, query_debounce);

	const handleItemSelect = useCallback((item, e) => {
		if(!item){
			itemSelect(null);
		} else {
			const { key, location } = item;
			if(JSON.stringify(selectedItemID) === JSON.stringify({ key, location })){
				return;
			} else {
				if(quickCopyProps.isActive){
					// Mode: Quick Copy
					copyToClipboard(formatItemReferenceForCopy(item, copySettings.defaultFormat));
					if(copySettings.overrideKey && e[copySettings.overrideKey] == true){
						searchbar.current.blur();
						itemSelect({ key, location });
					} else {
						handleClose();
					}
				} else {
					if(copySettings.always == true){
						copyToClipboard(formatItemReferenceForCopy(item, copySettings.defaultFormat));
					}
					searchbar.current.blur();
					itemSelect({ key, location });
				}
			}
		}
	}, [copySettings, handleClose, quickCopyProps.isActive, searchbar, selectedItemID]);

	const selectedItem = useMemo(() => {
		if(selectedItemID == null){
			return null;
		} else {
			const { key, location } = selectedItemID;
			return items.find(it => it.key == key && it.location == location);
		}
	}, [items, selectedItemID]);

	const handleQueryChange = useCallback((query, _e) => {
		handleItemSelect(null);
		setQuery(query);
		debouncedCallback(query);
	}, [handleItemSelect, debouncedCallback]);

	const listRenderer = useCallback((listProps) => {
		const { handleKeyUp, handleKeyDown, handleQueryChange, itemList } = listProps;
		return (
			<div className="zr-querylist">
				<SearchInputGroup 
					handleClose={handleClose}
					handleKeyDown={handleKeyDown} 
					handleKeyUp={handleKeyUp} 
					handleQueryChange={handleQueryChange}
					quickCopyProps={quickCopyProps}
					searchbar={searchbar} />
				<RenderedList handleClose={handleClose} handleKeyDown={handleKeyDown} handleKeyUp={handleKeyUp} itemList={itemList} selectedItem={selectedItem} />
			</div>
		);
	}, [handleClose, quickCopyProps, searchbar, selectedItem]);

	useEffect(() => {
		if(isOpen){
		// On opening the panel :
			searchbar.current.focus();
		} else {
			// On closing the panel :
			setQuery("");
			itemSelect(null);
		}
	}, [isOpen, searchbar]);
	

	return (
		<QueryList
			initialContent={null}
			items={items}
			itemListPredicate={itemListPredicate}
			itemRenderer={listItemRenderer}
			itemsEqual={testItemsEquality}
			onItemSelect={handleItemSelect}
			onQueryChange={handleQueryChange}
			query={query}
			renderer={listRenderer}
		/>
	);
});
LibraryQueryList.propTypes = {
	handleClose: func,
	isOpen: bool,
	items: customPropTypes.cleanLibraryReturnArrayType,
	quickCopyProps: shape({
		isActive: bool,
		toggle: func
	})
};

export default LibraryQueryList;
