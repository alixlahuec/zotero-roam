import { useCallback, useEffect, useRef, useState } from "react";
import { Classes, Icon, InputGroup, InputGroupProps2, MenuItem } from "@blueprintjs/core";
import { QueryList, QueryListProps } from "@blueprintjs/select";

import { QueryFilter, SearchSuggestion, useSearchQuery } from "@hooks";

import "./_index.sass";


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
	onQueryChange: (query: string) => void,
	query: string
};

function ExplorerQueryList<T extends Record<string, any>>({ filters, onQueryChange, query }: Props<T>) {
	const searchbar = useRef<HTMLInputElement>(null);
	const [cursorPosition, updateCursorPosition] = useState(() => searchbar.current?.selectionStart || 0);
	const [showSuggestions, setShowSuggestions] = useState(false);

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

	const { applySuggestion, suggestions } = useSearchQuery<T>({ cursorPosition, filters, handleQueryChange, query, setCursorPosition });

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

		return <>
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
				spellCheck="false"
				type="text"
				value={query}
			/>
			{showSuggestions && <div id="zr-explorer-suggestions">{itemList}</div>}
		</>;
	}, [searchbar, showSuggestions]);

	useEffect(() => {
		// TODO: make this less noisy potentially
		document.addEventListener("selectionchange", refreshCursorPosition);
		return () => document.removeEventListener("selectionchange", refreshCursorPosition);
	}, [refreshCursorPosition]);

	return <QueryList<SearchSuggestion<T>>
		itemRenderer={itemRenderer}
		items={suggestions}
		itemsEqual={"value"}
		onItemSelect={handleItemSelect}
		onQueryChange={handleQueryChange}
		query={query}
		renderer={listRenderer}
	/>;
}

export default ExplorerQueryList;