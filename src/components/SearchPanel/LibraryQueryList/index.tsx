import { ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Menu, MenuItem } from "@blueprintjs/core";
import { IItemRendererProps, QueryList, QueryListProps, renderFilteredItems } from "@blueprintjs/select";

import ItemDetails from "Components/ItemDetails";
import SearchInputGroup, { SearchInputGroupProps } from "../SearchInputGroup";
import { useCopySettings } from "Components/UserSettings";

import { useDebounceCallback } from "@hooks";

import { resultClass, resultKeyClass } from "../classes";
import { formatItemReferenceWithDefault } from "../helpers";

import { CustomClasses } from "../../../constants";
import { copyToClipboard, pluralize, searchEngine } from "../../../utils";
import { ZCleanItemTop } from "Types/transforms";

import "./_index.sass";


const query_debounce = 300;
const query_threshold = 0;
const results_limit = 50;

const staticProps: Partial<QueryListProps<ZCleanItemTop>> & Required<Pick<QueryListProps<ZCleanItemTop>, "itemRenderer">> = {
	itemListPredicate: (query, items) => {
		if(query.length < query_threshold){
			return [];
		} else {
			return items.filter(item => searchEngine(
				query, 
				[item.key, item._multiField],
				{ 
					any_case: true, 
					match: "partial", 
					search_compounds: true, 
					word_order: "loose"
				}
			));
		}
	},
	/** @see https://github.com/palantir/blueprint/blob/101d0feecda50a52bf62ca2e0551aff77c67923b/packages/select/src/components/query-list/queryList.tsx#L345 */
	itemListRenderer: (listProps) => {
		const { filteredItems, itemsParentRef, ...rest } = listProps;
		const noResults = null;
		const initialContent = null;

		const totalResults = filteredItems.length;
		const menuContent = renderFilteredItems({ filteredItems: filteredItems.slice(0, results_limit), itemsParentRef, ...rest }, noResults, initialContent);

		if(menuContent == null){
			return null;
		} else {
			return <>
				<Menu ulRef={itemsParentRef}>{menuContent}</Menu>
				{totalResults > results_limit && <div className="zr-querylist--more-results">Showing {results_limit} out of {pluralize(totalResults, "result")}</div>}
			</>;
		}
	},
	itemRenderer: (item, itemProps) => {
		const { handleClick, modifiers /*, query*/ } = itemProps;
		const elemKey = [item.location, item.key].join("-");

		return <SearchResult key={elemKey}
			handleClick={handleClick}
			item={item}
			modifiers={modifiers}
		/>;
	},
	itemsEqual: (a, b) => (a.itemKey == b.itemKey && a.location == b.location)
};


type SearchResultProps = {
	item: ZCleanItemTop
} & Pick<IItemRendererProps, "handleClick" | "modifiers">;

const SearchResult = memo<SearchResultProps>(function SearchResult(props) {
	const { item, handleClick, modifiers } = props;
	const { inGraph, itemType, key, meta, publication, title } = item;

	return <MenuItem
		onClick={handleClick}
		className="zotero-roam-search_result"
		role="menuitem"
		data-item-type={itemType}
		data-in-graph={(inGraph != false).toString()}
		htmlTitle={title}
		labelElement={"@" + key}
		labelClassName={resultKeyClass}
		aria-selected={modifiers.active}
		tagName="div"
		text={
			<>
				<span className="zr-library-item--title">{title}</span>
				<span className="zr-details">
					<span className={CustomClasses.TEXT_ACCENT_1}>{meta}</span>
					<span className={CustomClasses.TEXT_SECONDARY}>{publication}</span>
				</span>
			</>
		}
		textClassName={resultClass}
	/>;
});


type RenderedListProps = {
	handleClose: () => void,
	itemList: ReactNode,
	selectedItem: ZCleanItemTop | null
};

const RenderedList = memo<RenderedListProps>(function RenderedList(props){
	const { handleClose/*, handleKeyDown, handleKeyUp*/, itemList, selectedItem } = props;

	return selectedItem 
		? <ItemDetails item={selectedItem} 
			closeDialog={handleClose} />
		: <div id="zotero-roam-library-rendered" >
			{itemList}
		</div>;
});


type LibraryQueryListProps = {
	isOpen: boolean,
	items: ZCleanItemTop[],
	quickCopyProps
} & Pick<SearchInputGroupProps, "handleClose" | "quickCopyProps">;

const LibraryQueryList = memo<LibraryQueryListProps>(function LibraryQueryList(props) {
	const { handleClose, isOpen, items, quickCopyProps } = props;
	const [copySettings] = useCopySettings();

	const searchbar = useRef<HTMLInputElement>(null);
	const [selectedItemID, itemSelect] = useState<Pick<ZCleanItemTop, "key" | "location"> | null>(null);
	const [query, setQuery] = useState<string>();
	// Debouncing query : https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
	const [debouncedCallback/*, cancel */] = useDebounceCallback(_query => { }, query_debounce);

	const handleItemSelect = useCallback<QueryListProps<ZCleanItemTop>["onItemSelect"]>((item, e) => {
		if(!item){
			itemSelect(null);
		} else {
			const { key, location } = item;
			if(JSON.stringify(selectedItemID) === JSON.stringify({ key, location })){
				return;
			} else {
				if(quickCopyProps.isActive){
					// Mode: Quick Copy
					copyToClipboard(formatItemReferenceWithDefault(item, copySettings));
					if(copySettings.overrideKey && e?.[copySettings.overrideKey] == true){
						searchbar?.current?.blur();
						itemSelect({ key, location });
					} else {
						handleClose();
					}
				} else {
					if(copySettings.always == true){
						copyToClipboard(formatItemReferenceWithDefault(item, copySettings));
					}
					searchbar?.current?.blur();
					itemSelect({ key, location });
				}
			}
		}
	}, [copySettings, handleClose, quickCopyProps.isActive, searchbar, selectedItemID]);

	const selectedItem = useMemo<ZCleanItemTop | null>(() => {
		if(selectedItemID == null){
			return null;
		} else {
			const { key, location } = selectedItemID;
			return items.find(it => it.key == key && it.location == location)!;
		}
	}, [items, selectedItemID]);

	const handleQueryChange = useCallback((queryString, _e) => {
		itemSelect(null);
		setQuery(queryString);
		debouncedCallback(queryString);
	}, [debouncedCallback]);

	const listRenderer = useCallback<QueryListProps<ZCleanItemTop>["renderer"]>((listProps) => {
		const { handleKeyUp, handleKeyDown, handleQueryChange: queryHandler, itemList } = listProps;
		return (
			<div className="zr-querylist">
				<SearchInputGroup 
					handleClose={handleClose}
					handleKeyDown={handleKeyDown} 
					handleKeyUp={handleKeyUp} 
					handleQueryChange={queryHandler}
					quickCopyProps={quickCopyProps}
					searchbar={searchbar} />
				<RenderedList handleClose={handleClose} itemList={itemList} selectedItem={selectedItem} />
			</div>
		);
	}, [handleClose, quickCopyProps, searchbar, selectedItem]);

	useEffect(() => {
		if(isOpen){
		// On opening the panel :
			searchbar?.current?.focus();
		} else {
			// On closing the panel :
			setQuery("");
			itemSelect(null);
		}
	}, [isOpen, searchbar]);
	

	return (
		<QueryList<ZCleanItemTop>
			items={items}
			onItemSelect={handleItemSelect}
			onQueryChange={handleQueryChange}
			query={query}
			renderer={listRenderer}
			{...staticProps}
		/>
	);
});


export default LibraryQueryList;
