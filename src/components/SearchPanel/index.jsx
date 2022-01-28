import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Classes, Icon, InputGroup, MenuItem, Switch, useHotkeys } from "@blueprintjs/core";
import { QueryList } from "@blueprintjs/select";

import DialogOverlay from "../DialogOverlay";
import ItemDetails from "./ItemDetails";
import { copyToClipboard } from "../../utils";
import { getCitekeyPages } from "../../roam";
import { cleanLibrary, formatItemReferenceForCopy } from "./utils";
import * as customPropTypes from "../../propTypes";
import "./index.css";
import { useQuery_Items } from "../../queries";

const query_threshold = 3;
const query_debounce = 300;
const results_limit = 50;

const dialogLabel="zr-library-search-dialogtitle";
const dialogClass="search-library";
const resultClass = [Classes.TEXT_OVERFLOW_ELLIPSIS, "zr-library-item--contents"].join(" ");
const resultKeyClass = [Classes.MENU_ITEM_LABEL, "zr-library-item--key"].join(" ");

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

function listItemRenderer(item, itemProps) {
	let { handleClick, modifiers /*, query*/ } = itemProps;
	let elemKey = [item.location, item.key].join("-");

	return <SearchResult key={elemKey}
		handleClick={handleClick}
		item={item}
		modifiers={modifiers}
	/>;
}

const SearchInputGroup = React.memo(function SearchInputGroup(props) {
	const { handleKeyDown, handleKeyUp, handleQueryChange, searchbar, searchbarLeftElement, searchbarRightElement } = props;

	return (
		<InputGroup
			className={(Classes.INPUT, Classes.FILL)}
			id="zotero-roam-search-autocomplete"
			placeholder="Search by title, year, authors (last names), citekey, tags"
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
	handleKeyDown: PropTypes.func,
	handleKeyUp: PropTypes.func,
	handleQueryChange: PropTypes.func,
	searchbar: PropTypes.node,
	searchbarLeftElement: PropTypes.node,
	searchbarRightElement: PropTypes.node
};

function renderListDiv(handleKeyDown, handleKeyUp, itemList, context){
	const { handleClose, selectedItem, settings: { copy, metadata } } = context;

	return selectedItem 
		? <ItemDetails item={selectedItem} 
			closeDialog={handleClose} 
			defaultCopyFormat={copy.defaultFormat}
			metadataSettings={metadata} />
		: <div id="zotero-roam-library-rendered" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} >
			{itemList}
		</div>;
}

function searchEngine(query, items) {
	if(query.length < query_threshold){
		return [];
	} else {
		let matches = [];

		for(let i = 0; matches.length < results_limit && i < items.length;i++){
			let item = items[i];
			if(item.title.includes(query)){
				matches.push(item);
			}
		}
  
		return matches;
	}
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
				<span className="zotero-roam-search-item-title">{title}</span>
				<span className="zr-details">
					<span className="zotero-roam-search-item-authors zr-highlight">{authors + " (" + year + ")"}</span>
					<span className="zr-secondary">{publication}</span>
				</span>
			</>
		}
		textClassName={resultClass}
	/>;
});
SearchResult.propTypes = {
	item: customPropTypes.cleanLibraryItemType,
	handleClick: PropTypes.func,
	modifiers: PropTypes.object
};

const LibraryQueryList = React.memo(function LibraryQueryList(props) {
	const { copySettings, handleClose, isOpen, items, metadataSettings, quickCopyActive, toggleQuickCopy } = props;

	const searchbar = useRef();
	let [selectedItem, itemSelect] = useState(null);
	let [query, setQuery] = useState();
	// Debouncing query : https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
	const [debouncedCallback, ] = useDebounceCallback(_query => { }, query_debounce);

	const handleItemSelect = useCallback((item, e) => {
		if(item === selectedItem){ 
			return; 
		} else if(!item){
			itemSelect(null);
		} else {
			if(quickCopyActive){
				// Mode: Quick Copy
				copyToClipboard(formatItemReferenceForCopy(item, copySettings.defaultFormat));
				if(copySettings.overrideKey && e[copySettings.overrideKey] == true){
					searchbar.current.blur();
					itemSelect(item);
				} else {
					handleClose();
				}
			} else {
				if(copySettings.always == true){
					copyToClipboard(formatItemReferenceForCopy(item, copySettings.defaultFormat));
				}
				searchbar.current.blur();
				itemSelect(item);
			}
		}
	}, [copySettings, handleClose, quickCopyActive, searchbar, selectedItem]);

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
				{renderListDiv(
					handleKeyDown, 
					handleKeyUp, 
					itemList, 
					{ 
						handleClose, 
						selectedItem,
						settings: {
							copy: copySettings,
							metadata: metadataSettings
						}
					})}
			</div>
		);
	}, [copySettings, handleClose, metadataSettings, searchbar, searchbarLeftElement, searchbarRightElement, selectedItem]);

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
			itemListPredicate={searchEngine}
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
	copySettings: PropTypes.shape({
		always: PropTypes.bool,
		defaultFormat: PropTypes.oneOf(["citation", "citekey", "page-reference", "raw", "tag", PropTypes.func]),
		overrideKey: PropTypes.oneOf(["altKey", "ctrlKey", "metaKey", "shiftKey"]),
		useQuickCopy: PropTypes.bool
	}),
	handleClose: PropTypes.func,
	isOpen: PropTypes.bool,
	items: customPropTypes.cleanLibraryReturnArrayType,
	metadataSettings: PropTypes.object,
	quickCopyActive: PropTypes.bool,
	toggleQuickCopy: PropTypes.func
};

const SearchPanel = React.memo(function SearchPanel(props) {
	const { isOpen, isSidePanelOpen } = props.panelState;
	const { closePanel, copySettings, dataRequests, metadataSettings, portalTarget, shortcutsSettings, status } = props;

	let [quickCopyActive, setQuickCopy] = useState(copySettings.useQuickCopy); // Is QuickCopy active by default ?
	let [roamCitekeys, setRoamCitekeys] = useState(getCitekeyPages());

	const items = useGetItems(dataRequests, roamCitekeys, { enabled: status == "on" });

	const handleOpen = useCallback(() => {
		setRoamCitekeys(getCitekeyPages()); 
	}, []);

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
			onClose={closePanel}
			onOpening={handleOpen}
			portalTarget={portalTarget}>
			<LibraryQueryList 
				copySettings={copySettings}
				handleClose={closePanel}
				isOpen={isOpen}
				items={items}
				metadataSettings={metadataSettings}
				quickCopyActive={quickCopyActive}
				toggleQuickCopy={toggleQuickCopy} />
		</DialogOverlay>
	);

});
SearchPanel.propTypes = {
	closePanel: PropTypes.func,
	copySettings: PropTypes.shape({
		always: PropTypes.bool,
		defaultFormat: PropTypes.oneOf(["citation", "citekey", "page-reference", "raw", "tag", PropTypes.func]),
		overrideKey: PropTypes.oneOf(["altKey", "ctrlKey", "metaKey", "shiftKey"]),
		useQuickCopy: PropTypes.bool
	}),
	dataRequests: PropTypes.array,
	metadataSettings: PropTypes.object,
	panelState: PropTypes.shape({
		isOpen: PropTypes.bool,
		isSidePanelOpen: PropTypes.bool
	}),
	portalTarget: PropTypes.string,
	shortcutsSettings: PropTypes.object,
	status: PropTypes.bool
};

export default SearchPanel;
