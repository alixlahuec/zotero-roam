import React, { useCallback, useMemo, useState } from "react";
import { arrayOf, func, oneOf, shape} from "prop-types";
import { Button, ControlGroup, InputGroup, NonIdealState } from "@blueprintjs/core";

import SemanticItem from "./SemanticItem";
import { searchEngine } from "../../../utils";

import * as customPropTypes from "../../../propTypes";

const itemsPerPage = 30;

function itemListPredicate(query, items){
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

function DatalistItem({item, selectProps, type}){
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
DatalistItem.propTypes = {
	item: customPropTypes.cleanSemanticReturnType,
	selectProps: shape({
		handleRemove: func,
		handleSelect: func,
		items: arrayOf(customPropTypes.cleanSemanticReturnType),
		resetImport: func
	}),
	type: oneOf(["is_citation", "is_reference"])
};

const SemanticPagination = React.memo(function Pagination(props){
	const { items, selectProps, type } = props;
	const [currentPage, setCurrentPage] = useState(1);
	const [query, setQuery] = useState();

	const handleSearch = useCallback((event) => {
		let search = event.target?.value;
		setQuery(search || null);
	}, []);

	const filteredItems = useMemo(() => !query ? items : itemListPredicate(query, items), [items, query]);

	const nbPages = useMemo(() => filteredItems.length == 0 ? 0 : Math.ceil(filteredItems.length / itemsPerPage), [filteredItems.length]);
	const previousPage = useCallback(() => setCurrentPage((current) => current > 1 ? (current - 1) : current), []);
	const nextPage = useCallback(() => setCurrentPage((current) => current < nbPages ? (current + 1) : current), [nbPages]);

	return (
		<>
			<div className="zr-datalist--toolbar">
				<InputGroup
					autoComplete="off"
					id={"semantic-search--" + type}
					leftIcon="search"
					placeholder="Search by title, authors (last names), or year"
					spellCheck="false"
					onChange={handleSearch}
					value={query} />
			</div>
			<div className="zr-datalist--listwrapper">
				{filteredItems.length > 0
					? filteredItems.slice(itemsPerPage*(currentPage - 1), itemsPerPage*currentPage).map(el => <DatalistItem key={[el.doi, el.url, el.title].filter(Boolean).join("-")} item={el} selectProps={selectProps} type={type} />)
					: <NonIdealState className="zr-auxiliary" description="No results found" /> }
			</div>
			<div className="zr-datalist--toolbar">
				<div className="zr-datalist--pagination">
					{filteredItems.length > 0
						? <>
							<span className="zr-text-small" zr-role="items-count">
								<strong>{(currentPage - 1)*30 + 1}-{Math.min(currentPage*30, filteredItems.length)}</strong> / {filteredItems.length} entries
							</span>
							<ControlGroup>
								<Button disabled={currentPage == 1} icon="chevron-left" minimal={true} onClick={previousPage} />
								<Button disabled={currentPage >= nbPages} icon="chevron-right" minimal={true} onClick={nextPage} />
							</ControlGroup>
						</>
						: null}
				</div>
			</div>
		</>
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
