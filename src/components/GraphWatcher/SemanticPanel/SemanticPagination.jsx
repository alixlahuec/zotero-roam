import React, { useCallback, useMemo, useState } from "react";
import { arrayOf, func, oneOf, shape} from "prop-types";
import { InputGroup, NonIdealState } from "@blueprintjs/core";

import SemanticItem from "./SemanticItem";
import { ListWrapper, Pagination, Toolbar } from "../../DataList";

import { searchEngine } from "../../../utils";
import * as customPropTypes from "../../../propTypes";
import SortButtons from "../../SortButtons";

const itemsPerPage = 30;

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

function sort(items, sortBy){
	let arr = [...items];
	switch(sortBy){
	case "library": {
		let categorized = arr.reduce((obj, elem) => {
			if(elem.inLibrary == false){
				obj.notLibrary.push(elem);
			} else {
				obj.library.push(elem);
			}
			return obj;
		}, { library: [], notLibrary: []});
		return [...categorized.library, ...categorized.notLibrary];
	}
	case "influential": {
		let categorized = arr.reduce((obj, elem) => {
			if(elem.isInfluential){
				obj.influential.push(elem);
			} else {
				obj.notInfluential.push(elem);
			}
			return obj;
		}, { influential: [], notInfluential: [] });
		return [...categorized.influential, ...categorized.notInfluential];
	}
	case "year":
	default:
		return arr;
	}
}

function Item({item, selectProps, type}){
	let { handleRemove, handleSelect, items: selectedItems } = selectProps;
	let isSelected = selectedItems.findIndex(i => i.doi == item.doi || i.url == item.url) >= 0;

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

const SemanticPagination = React.memo(function SemanticPagination(props){
	const { items, selectProps, type } = props;
	const [currentPage, setCurrentPage] = useState(1);
	const [query, setQuery] = useState();
	const [sortBy, setSortBy] = useState("year");

	const pageLimits = useMemo(() => [itemsPerPage*(currentPage - 1), itemsPerPage*currentPage], [currentPage]);

	const handleSearch = useCallback((event) => {
		let search = event.target?.value;
		setQuery(search || null);
	}, []);

	const filteredItems = useMemo(() => !query ? items : search(query, items), [items, query]);

	const handleSort = useCallback((value) => {
		setSortBy(() => value);
		setCurrentPage(1);
	}, []);

	const sortOptions = useMemo(() => [
		{ icon: "sort", label: "Publication Year", value: "year" },
		{ icon: "graph", label: "In Library", value: "library"},
		{ icon: "trending-up", label: "Highly Influential", value: "influential" }
	], []);

	const sortedItems = useMemo(() => sort(filteredItems, sortBy), [filteredItems, sortBy]);

	return (
		<div className="rendered-div">
			<Toolbar>
				<SortButtons name={"zr-semantic-sort--" + type} onSelect={handleSort} options={sortOptions} selectedOption={sortBy} />
				<InputGroup
					autoComplete="off"
					id={"semantic-search--" + type}
					leftIcon="search"
					onChange={handleSearch}
					placeholder="Search by title, authors (last names), or year"
					spellCheck="false"
					value={query} />
			</Toolbar>
			<ListWrapper>
				{sortedItems.length > 0
					? sortedItems
						.slice(...pageLimits)
						.map(el => 
							<Item key={[el.doi, el.url, el.title].filter(Boolean).join("-")} 
								item={el} selectProps={selectProps} type={type} />)
					: <NonIdealState className="zr-auxiliary" description="No results found" /> }
			</ListWrapper>
			<Toolbar>
				<Pagination
					arrows="first"
					currentPage={currentPage} 
					itemsPerPage={itemsPerPage}
					nbItems={sortedItems.length} 
					setCurrentPage={setCurrentPage} />
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
