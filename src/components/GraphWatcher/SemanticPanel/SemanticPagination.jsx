import React, { useCallback, useMemo, useState } from "react";
import { arrayOf, func, oneOf, shape} from "prop-types";
import { InputGroup, NonIdealState } from "@blueprintjs/core";

import SemanticItem from "./SemanticItem";
import { ListWrapper, Pagination, Toolbar } from "../../DataList";

import { searchEngine } from "../../../utils";
import * as customPropTypes from "../../../propTypes";

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

	const pageLimits = useMemo(() => [itemsPerPage*(currentPage - 1), itemsPerPage*currentPage], [currentPage]);

	const handleSearch = useCallback((event) => {
		let search = event.target?.value;
		setQuery(search || null);
	}, []);

	const filteredItems = useMemo(() => !query ? items : search(query, items), [items, query]);

	return (
		<div className="rendered-div">
			<Toolbar>
				<InputGroup
					autoComplete="off"
					id={"semantic-search--" + type}
					leftIcon="search"
					placeholder="Search by title, authors (last names), or year"
					spellCheck="false"
					onChange={handleSearch}
					value={query} />
			</Toolbar>
			<ListWrapper>
				{filteredItems.length > 0
					? filteredItems
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
					nbItems={filteredItems.length} 
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
