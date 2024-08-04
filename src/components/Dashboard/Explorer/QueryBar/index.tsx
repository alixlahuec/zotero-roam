import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Classes, Icon, InputGroup, InputGroupProps2, MenuItem, NonIdealState, Tag } from "@blueprintjs/core";
import { QueryList, QueryListProps } from "@blueprintjs/select";

import { ListWrapper, Pagination, Toolbar } from "Components/DataList";

import { QueryFilter, SearchSuggestion, usePagination, useSearchQuery } from "@hooks";

import { CustomClasses } from "../../../../constants";

import "./_index.sass";

const itemsPerPage = 20;

const searchbarLeftElement = <Icon
	icon="search"
	intent="primary"
	htmlTitle="Add search filters"
	size={14}
	title="Add search filters"
/>;


const itemRenderer: QueryListProps<SearchSuggestion>["itemRenderer"] = (item, itemProps) => {
	const { handleClick, modifiers /*, query*/ } = itemProps;
	const isFilter = "presets" in item;

	return <MenuItem key={item.value}
		aria-selected={modifiers.active}
		className="zr-explorer-suggestion"
		data-testid="explorer-suggestion"
		labelClassName={Classes.CODE}
		labelElement={item.value + (isFilter ? ":" : "")}
		onClick={handleClick}
		role="menuitem"
		tagName="div"
		text={<>
			<span className="zr-explorer-suggestion--label">{item.label}</span>
			<span className="zr-details zr-auxiliary">{isFilter ? item.presets.map((preset) => preset.label).join(" / ") : null}</span>
		</>}
		textClassName={[Classes.TEXT_OVERFLOW_ELLIPSIS, "zr-explorer-suggestion--contents"].join(" ")}
	/>;
};


type Props<T extends Record<string, any> = Record<string, any>> = {
	filters: QueryFilter<T>[],
	items: T[],
	onQueryChange: (query: string) => void,
	query: string,
	renderItem: (item: T) => ReactNode
	search_field?: keyof T
};

function QueryBar<T extends Record<string, any>>({ filters, items, onQueryChange, query, renderItem, search_field }: Props<T>) {
	const searchbar = useRef<HTMLInputElement>(null);
	const [cursorPosition, updateCursorPosition] = useState(() => searchbar.current?.selectionStart || 0);

	const refreshCursorPosition = useCallback(() => {
		const posWithinSearchbar = searchbar.current?.selectionStart;
		if (posWithinSearchbar !== undefined && posWithinSearchbar !== null) updateCursorPosition(posWithinSearchbar);
	}, [searchbar, updateCursorPosition]);

	const setCursorPosition = useCallback((pos: number) => {
		searchbar.current?.focus();
		searchbar.current?.setSelectionRange(pos, null, "none");
		refreshCursorPosition();
	}, [searchbar, refreshCursorPosition]);

	const handleQueryChange = useCallback<Required<QueryListProps<SearchSuggestion<T>>>["onQueryChange"]>((query) => {
		refreshCursorPosition();
		onQueryChange(query);
	}, [onQueryChange, refreshCursorPosition]);

	const { applySuggestion, search, suggestions } = useSearchQuery<T>({ cursorPosition, filters, handleQueryChange, query, search_field, setCursorPosition });

	const [queriedItems, setQueriedItems] = useState(() => search(items));
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });
	const [showSuggestions, setShowSuggestions] = useState(false);

	const handleSearch = useCallback(() => {
		setQueriedItems(search(items));
	}, [items, search, setQueriedItems]);

	const handleItemSelect = useCallback<QueryListProps<SearchSuggestion<T>>["onItemSelect"]>((item, _e) => {
		applySuggestion(item);
	}, [applySuggestion]);

	const listRenderer = useCallback<QueryListProps<SearchSuggestion<T>>["renderer"]>((listProps) => {
		const { handleKeyUp, handleKeyDown, handleQueryChange: onChange, itemList, query } = listProps;

		const handleBlur: InputGroupProps2["onBlur"] = (e) => {
			if (e.relatedTarget?.closest(`#zr-explorer-suggestions`)) {
				return
			}
			setShowSuggestions(false)
		}

		return <div className="zr-explorer-search-wrapper">
			<InputGroup
				autoComplete="off"
				className={[Classes.INPUT, Classes.FILL, "zr-explorer-search-input-group"].join(" ")}
				data-testid="explorer-searchbar"
				id="zr-explorer-searchbar"
				inputRef={searchbar}
				leftElement={searchbarLeftElement}
				onBlur={handleBlur}
				onChange={onChange}
				onFocus={() => setShowSuggestions(true)}
				onKeyDown={handleKeyDown}
				onKeyUp={handleKeyUp}
				placeholder="Start typing to see suggestions"
				rightElement={<Tag intent="primary" interactive={true} minimal={true} onClick={handleSearch}>Enter</Tag>}
				spellCheck="false"
				type="text"
				value={query}
			/>
			{showSuggestions && <div id="zr-explorer-suggestions" style={{ position: "absolute", width: "100%"}}>{itemList}</div>}
		</div>;
	}, [handleSearch, searchbar, showSuggestions]);

	useEffect(() => {
		// TODO: make this less noisy potentially
		document.addEventListener("selectionchange", refreshCursorPosition);
		return () => document.removeEventListener("selectionchange", refreshCursorPosition);
	}, [refreshCursorPosition]);

	useEffect(() => {
		setCurrentPage(1);
	}, [queriedItems.length, setCurrentPage]);

	return <>
		<Toolbar>
			<QueryList<SearchSuggestion<T>>
				itemRenderer={itemRenderer}
				items={suggestions}
				itemsEqual={"value"}
				onItemSelect={handleItemSelect}
				onQueryChange={handleQueryChange}
				query={query}
				renderer={listRenderer}
			/>
		</Toolbar>
		<div className="zr-queryitems--datalist">
			{queriedItems.length == 0
				? <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No items to display" />
				: <ListWrapper>
					{queriedItems
						.slice(...pageLimits)
						.map(el => renderItem(el))}
				</ListWrapper>}
		</div>
		<Toolbar>
			<Pagination
				arrows="first"
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
				nbItems={queriedItems.length}
				setCurrentPage={setCurrentPage}
			/>
		</Toolbar>
	</>;
}

export default QueryBar;