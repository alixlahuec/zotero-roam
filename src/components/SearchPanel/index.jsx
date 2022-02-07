import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { bool, func, node, object, shape } from "prop-types";
import { Button, Classes, Icon, InputGroup, MenuItem, Switch, useHotkeys } from "@blueprintjs/core";
import { QueryList } from "@blueprintjs/select";

import DialogOverlay from "../DialogOverlay";
import ItemDetails from "../ItemDetails";

import { useQuery_Items } from "../../api/queries";
import { cleanLibrary, formatItemReferenceForCopy } from "./utils";
import { copyToClipboard, searchEngine } from "../../utils";

import { ExtensionContext, UserSettings } from "../App";
import * as customPropTypes from "../../propTypes";
import "./index.css";
import { useRoamCitekeys } from "../RoamCitekeysContext";

const query_threshold = 0;
const query_debounce = 300;
const results_limit = 50;

const dialogLabel="zr-library-search-dialogtitle";
const dialogClass="search-library";
const resultClass = [Classes.TEXT_OVERFLOW_ELLIPSIS, "zr-library-item--contents"].join(" ");
const resultKeyClass = [Classes.MENU_ITEM_LABEL, "zr-library-item--key"].join(" ");


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

function useGetItems(reqs, roamCitekeys, opts = {}){
	const itemQueries = useQuery_Items(reqs, {
		...opts,
		notifyOnChangeProps: ["data"],
		select: (datastore) => {
			if(datastore.data){
				return cleanLibrary(datastore.data, roamCitekeys);
			} else {
				return [];
			}
		}
	});

	return itemQueries.map(q => q.data || []).flat(1);
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

const RenderedList = React.memo(function RenderedList({ handleClose, handleKeyDown, handleKeyUp, itemList, selectedItem }){
	return selectedItem 
		? <ItemDetails item={selectedItem} 
			closeDialog={handleClose} />
		: <div id="zotero-roam-library-rendered" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} >
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

function testItemsEquality(a,b){
	return (a.itemKey == b.itemKey && a.location == b.location);
}

const SearchInputGroup = React.memo(function SearchInputGroup(props) {
	const { handleKeyDown, handleKeyUp, handleQueryChange, searchbar, searchbarLeftElement, searchbarRightElement } = props;

	return (
		<InputGroup
			className={(Classes.INPUT, Classes.FILL)}
			id="zotero-roam-search-autocomplete"
			placeholder="Search by title, authors (last names), year, tags, or citekey"
			spellCheck="false"
			autoComplete="off"
			type="text"
			large={true}
			onChange={handleQueryChange}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyUp}
			inputRef={searchbar}
			leftElement={searchbarLeftElement}
			rightElement={searchbarRightElement}
		/>
	)	;
});
SearchInputGroup.propTypes = {
	handleKeyDown: func,
	handleKeyUp: func,
	handleQueryChange: func,
	searchbar: node,
	searchbarLeftElement: node,
	searchbarRightElement: node
};

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

const LibraryQueryList = React.memo(function LibraryQueryList(props) {
	const { handleClose, isOpen, items, quickCopyActive, toggleQuickCopy } = props;
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
				if(quickCopyActive){
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
	}, [copySettings, handleClose, quickCopyActive, searchbar, selectedItemID]);

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

	const searchbarLeftElement = useMemo(() => <Icon id={dialogLabel} title="Search in Zotero items"
		htmlTitle="Search in Zotero items"
		intent="primary"
		icon="learning" />, []);

	const searchbarRightElement = useMemo(() => {
		return (
			<>
				<Switch className={["zr-quick-copy", "zr-auxiliary"].join(" ")} label="Quick Copy" checked={quickCopyActive} onChange={toggleQuickCopy} />
				<Button className={Classes.MINIMAL} large={true} icon="cross" onClick={handleClose} />
			</>
		);
	}, [quickCopyActive, toggleQuickCopy, handleClose]);

	const listRenderer = useCallback((listProps) => {
		const { handleKeyUp, handleKeyDown, handleQueryChange, itemList } = listProps;
		return (
			<div className="zr-querylist">
				<SearchInputGroup 
					handleKeyDown={handleKeyDown} 
					handleKeyUp={handleKeyUp} 
					handleQueryChange={handleQueryChange}
					searchbar={searchbar}
					searchbarLeftElement={searchbarLeftElement}
					searchbarRightElement={searchbarRightElement} />
				<RenderedList handleClose={handleClose} handleKeyDown={handleKeyDown} handleKeyUp={handleKeyUp} itemList={itemList} selectedItem={selectedItem} />
			</div>
		);
	}, [handleClose, searchbar, searchbarLeftElement, searchbarRightElement, selectedItem]);

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
	quickCopyActive: bool,
	toggleQuickCopy: func
};

const SearchPanel = React.memo(function SearchPanel(props) {
	const { isOpen, isSidePanelOpen } = props.panelState;
	const { closePanel, status } = props;
	const { dataRequests } = useContext(ExtensionContext);
	const [roamCitekeys,] = useRoamCitekeys();
	const { copy: { useQuickCopy}, shortcuts: shortcutsSettings } = useContext(UserSettings);

	let [quickCopyActive, setQuickCopy] = useState(useQuickCopy); // Is QuickCopy active by default ?

	const items = useGetItems(dataRequests, roamCitekeys, { enabled: status == "on" });

	const toggleQuickCopy = useCallback(() => { setQuickCopy(!quickCopyActive); }, [quickCopyActive]);

	const hotkeys = useMemo(() => {
		let defaultProps = {
			allowInInput: true,
			global: true
		};

		let configs = {
			"toggleQuickCopy": {
				disabled: !isOpen,
				label: "Toggle QuickCopy",
				onKeyDown: toggleQuickCopy
			}
		};

		return Object.keys(shortcutsSettings)
			.filter(k => Object.keys(configs).includes(k) && shortcutsSettings[k] != false)
			.map(k => {
				return {
					...defaultProps,
					...configs[k],
					combo: shortcutsSettings[k]
				};
			});
		
	}, [isOpen, shortcutsSettings, toggleQuickCopy]);

	useHotkeys(hotkeys, {showDialogKeyCombo: "shift+Z+R"});

	return (
		<DialogOverlay
			ariaLabelledBy={dialogLabel}
			className={dialogClass}
			isOpen={isOpen}
			isSidePanelOpen={isSidePanelOpen}
			lazy={false}
			onClose={closePanel} >
			<LibraryQueryList 
				handleClose={closePanel}
				isOpen={isOpen}
				items={items}
				quickCopyActive={quickCopyActive}
				toggleQuickCopy={toggleQuickCopy} />
		</DialogOverlay>
	);

});
SearchPanel.propTypes = {
	closePanel: func,
	panelState: shape({
		isOpen: bool,
		isSidePanelOpen: bool
	}),
	status: bool
};

export default SearchPanel;
