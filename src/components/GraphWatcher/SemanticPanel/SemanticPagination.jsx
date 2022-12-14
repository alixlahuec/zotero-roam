import { arrayOf, func, oneOf, shape } from "prop-types";
import { memo, useCallback, useMemo } from "react";

import { InputGroup, NonIdealState } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "Components/DataList";
import { SemanticGuide } from "Components/Guide";
import SemanticItem from "./SemanticItem";

import { searchEngine } from "../../../utils";
import useFilterList from "../../../hooks/useFilterList";
import usePagination from "../../../hooks/usePagination";
import useText from "../../../hooks/useText";

import { CustomClasses } from "../../../constants";

import * as customPropTypes from "../../../propTypes";
import FilterButtons from "Components/DataList/FilterSelect";


const itemsPerPage = 30;

const SEMANTIC_FILTER_OPTIONS = [
	{ active: false, label: "In Library", value: "library" },
	{ active: false, label: "Highly Influential", value: "influential" },
	{ active: false, label: "Has DOI", value: "doi" }
];
function filter(items, filterList){
	let arr = [...items];
	const activeFilters = filterList.filter(op => op.active == true);

	activeFilters.forEach(op => {
		switch(op.value){
		case "library":
			arr = arr.filter(item => item.inLibrary);
			break;
		case "influential":
			arr = arr.filter(item => item.isInfluential);
			break;
		case "doi":
			arr = arr.filter(item => item.doi);
			break;
		default:
			console.warning("Filter not recognized: " + op.value);
		}
	});

	return arr;
}

function search(query, items){
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

function Item({ item, selectProps, type }){
	const { handleRemove, handleSelect, items: selectedItems } = selectProps;
	const isSelected = selectedItems.findIndex(i => i.doi == item.doi || i.url == item.url) >= 0;

	return <SemanticItem key={item.doi} 
		handleRemove={handleRemove} 
		handleSelect={handleSelect} 
		inGraph={item.inGraph} 
		isSelected={isSelected}
		item={item} 
		type={type} />;
}
Item.propTypes = {
	item: customPropTypes.cleanSemanticReturnType,
	selectProps: shape({
		handleRemove: func,
		handleSelect: func,
		items: arrayOf(customPropTypes.cleanSemanticReturnType),
		resetImport: func
	}),
	type: oneOf(["is_citation", "is_reference"])
};

const SemanticPagination = memo(function SemanticPagination(props){
	const { items, selectProps, type } = props;
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });
	const [query, onQueryChange] = useText("");
	const [filterList, toggleFilter] = useFilterList(SEMANTIC_FILTER_OPTIONS);

	const handleFilter = useCallback((value) => {
		toggleFilter(value);
		setCurrentPage(1);
	}, [setCurrentPage, toggleFilter]);

	const filteredItems = useMemo(() => filter(items, filterList), [filterList, items]);

	const queriedItems = useMemo(() => !query ? filteredItems : search(query, filteredItems), [filteredItems, query]);

	return (
		<div className="rendered-div">
			<Toolbar>
				<FilterButtons options={filterList} toggleFilter={handleFilter} />
				<InputGroup
					aria-label="Search by title, authors (last names), or year"
					autoComplete="off"
					id={"semantic-search--" + type}
					leftIcon="search"
					onChange={onQueryChange}
					placeholder="Search items"
					spellCheck="false"
					title="Search by title, authors (last names), or year"
					value={query} />
			</Toolbar>
			<div className="zr-semantic--datalist">
				{queriedItems.length == 0
					? <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No results found" />
					: <ListWrapper>
						{queriedItems
							.slice(...pageLimits)
							.map(el => 
								<Item key={[el.doi, el.url, el.title].filter(Boolean).join("-")} 
									item={el} selectProps={selectProps} type={type} />)}
					</ListWrapper>
				}
			</div>
			<Toolbar>
				<Pagination
					arrows="first"
					currentPage={currentPage} 
					itemsPerPage={itemsPerPage}
					nbItems={queriedItems.length} 
					setCurrentPage={setCurrentPage} />
				<SemanticGuide />
			</Toolbar>
		</div>
	);
});
SemanticPagination.propTypes = {
	items: arrayOf(customPropTypes.cleanSemanticReturnType),
	selectProps: shape({
		handleRemove: func,
		handleSelect: func,
		items: arrayOf(customPropTypes.cleanSemanticReturnType),
		resetImport: func
	}),
	type: oneOf(["is_citation", "is_reference"])
};

export default SemanticPagination;
