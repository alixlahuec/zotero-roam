import React, { useCallback, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, Classes, Icon, InputGroup, MenuItem, Switch, useHotkeys } from "@blueprintjs/core";
import { QueryList } from "@blueprintjs/select";
import { useQueryClient } from "react-query";

import DialogOverlay from "../DialogOverlay";
import ItemDetails from "./ItemDetails";
import { copyToClipboard } from "../../utils";
import { getCitekeyPages } from "../../roam";
import { cleanLibrary, formatItemReferenceForCopy } from "./utils";
import * as customPropTypes from "../../propTypes";
import "./index.css";

const query_threshold = 3;
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

function listItemRenderer(item, itemProps) {
	let { handleClick, modifiers, query } = itemProps;
	let passedProps = { item, handleClick, modifiers, query };
	let { location, key } = item;

	return <SearchResult key={[location, key].join("-")} {...passedProps} />;
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
	modifiers: PropTypes.object,
	query: PropTypes.string
};

const SearchPanel = React.memo(function SearchPanel(props) {
	const { isOpen, isSidePanelOpen } = props.panelState;
	const { copySettings, handleChange, portalTarget, shortcutsSettings } = props;

	// Debouncing query : https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
	let [query, setQuery] = useState();
	const [debouncedCallback, ] = useDebounceCallback(_query => {
		//
	}, query_debounce);

	const searchbar = useRef();
	let [selectedItem, itemSelect] = useState(null);
	let [quickCopyActive, setQuickCopy] = useState(copySettings.useQuickCopy); // Is QuickCopy active by default ?
	let [roamCitekeys, setRoamCitekeys] = useState(getCitekeyPages());

	const client = useQueryClient();
	const items = cleanLibrary(client.getQueriesData("items").map((res) => res[1]?.data || []).flat(1), roamCitekeys);
	const has_data = items.length > 0;

	const handleClose = useCallback(() => {
		setQuery("");
		itemSelect(null);
		handleChange({
			isOpen: false,
			isSidePanelOpen: false
		});
	}, [handleChange]);

	const handleOpen = useCallback(() => {
		setRoamCitekeys(getCitekeyPages()); 
		searchbar.current.focus(); 
	}, []);

	const toggleOpenClosed = useCallback(() => {
		if(isOpen){
			handleClose();
		} else {
			handleOpen();
		}
	}, [isOpen, handleOpen, handleClose]);

	const toggleQuickCopy = useCallback(() => { setQuickCopy(!quickCopyActive); }, [quickCopyActive]);

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
	}, [copySettings.always, copySettings.defaultFormat, copySettings.overrideKey, handleClose, quickCopyActive, selectedItem]);

	function handleQueryChange(query, _e) {
		handleItemSelect(null);
		setQuery(query);
		debouncedCallback(query);
	}

	function listRenderer(listProps) {
		let { handleKeyDown, handleKeyUp, handleQueryChange } = listProps;

		const leftElem = <Icon id={dialogLabel} title="Search in Zotero items"
			htmlTitle="Search in Zotero items"
			intent="primary"
			icon="learning" />;

		const rightElem = <>
			<Switch className={["zr-quick-copy", "zr-auxiliary"].join(" ")} label="Quick Copy" checked={quickCopyActive} onChange={toggleQuickCopy} />
			<Button className={Classes.MINIMAL} large={true} icon="cross" onClick={handleClose} />
		</>;

		return (
			<div className="zr-querylist">
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
					leftElement={leftElem}
					rightElement={rightElem}
				/>
				{selectedItem ? <ItemDetails item={selectedItem} closeDialog={handleClose} defaultCopyFormat={copySettings.defaultFormat} />
					: <>
						<div
							id="zotero-roam-library-rendered"
							onKeyDown={handleKeyDown}
							onKeyUp={handleKeyUp}
						>
							{listProps.itemList}
						</div>
					</>}
			</div>
		);
	}

	const hotkeys = useMemo(() => {
		let defaultProps = {
			allowInInput: true,
			global: false
		};

		let configs = {
			"toggleQuickCopy": {
				disabled: !isOpen,
				group: "Search Panel",
				label: "Toggle QuickCopy",
				onKeyDown: () => toggleQuickCopy()
			},
			"toggleSearchPanel": {
				disabled: !has_data,
				global: true,
				label: "Toggle the Search Panel",
				onKeyDown: () => toggleOpenClosed()
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
		
	}, [has_data, isOpen, shortcutsSettings, toggleOpenClosed, toggleQuickCopy]);

	useHotkeys(hotkeys, {showDialogKeyCombo: "shift+Z+R"});

	return (
		<DialogOverlay
			ariaLabelledBy={dialogLabel}
			className={dialogClass}
			isOpen={isOpen}
			isSidePanelOpen={isSidePanelOpen}
			lazy={false}
			onClose={handleClose}
			onOpening={handleOpen}
			portalTarget={portalTarget}
			mainPanel={
				<QueryList
					initialContent={null}
					items={items}
					itemListPredicate={searchEngine}
					itemRenderer={listItemRenderer}
					onItemSelect={handleItemSelect}
					onQueryChange={handleQueryChange}
					query={query}
					renderer={listRenderer}
				/>}
			sidePanel=""
		/>
	);

});
SearchPanel.propTypes = {
	copySettings: PropTypes.shape({
		always: PropTypes.bool,
		defaultFormat: PropTypes.oneOf(["citation", "citekey", "page-reference", "raw", "tag", PropTypes.func]),
		overrideKey: PropTypes.oneOf(["altKey", "ctrlKey", "metaKey", "shiftKey"]),
		useQuickCopy: PropTypes.bool
	}),
	handleChange: PropTypes.func,
	panelState: PropTypes.shape({
		isOpen: PropTypes.bool,
		isSidePanelOpen: PropTypes.bool
	}),
	portalTarget: PropTypes.string,
	shortcutsSettings: PropTypes.object
};

export default SearchPanel;
