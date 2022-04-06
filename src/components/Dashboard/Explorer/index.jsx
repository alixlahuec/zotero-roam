import React, { useContext, useEffect, useMemo, useState } from "react";
import { arrayOf, func, shape } from "prop-types";
import { Button, NonIdealState, Spinner } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import { ListItem, ListWrapper, Pagination, Toolbar } from "../../DataList";

import { useQuery_Items } from "../../../api/queries";
import { categorizeLibraryItems, searchEngine } from "../../../utils";

import * as customPropTypes from "../../../propTypes";

const itemsPerPage = 30;

function eval_and(terms, item){
	let outcome = true;
	for(let i=0;i<terms.length && outcome == true;i++){
		outcome = eval_or(terms[i], item);
	}
	return outcome;
}

function eval_or(terms, item){
	let outcome = false;
	for(let i=0;i<terms.length && outcome == false;i++){
		outcome = eval_term(terms[i], item);
	}
	return outcome;
}

function eval_term(term, item){
	let { property, relationship = null, value = ""} = term;

	switch(property){
	case "title":
		if(!item.data.title){ return false; }
		if(!value){ return true; }
		switch(relationship){
		case "contains":
			return searchEngine(value, item.data.title); // TODO: Do defaults need to be changed here ? Or at least spelled out ?
		case "does not contain":
			return !searchEngine(value, item.data.title);
		default:
			throw new Error("Invalid relationship for title query : " + relationship);
		}
	case "abstract":
		switch(relationship){
		case "exists":
			return item.data.abstractNote && true;
		case "does not exist":
			return !item.data.abstractNote;
		case "contains":
		case "does not contain":
			if(!item.data.abstractNote){ return false; }
			if(!value){ return true; }
			if(relationship == "contains"){
				return searchEngine(value, item.data.abstractNote);
			} else {
				return !searchEngine(value, item.data.abstractNote);
			}
		default:
			throw new Error("Invalid relationship for abstract query : " + relationship);
		}
	case "tags": {
		let tagList = item.data.tags.map(t => t.tag);
		switch(relationship){
		case "includes":
			if(!value || tagList.length == 0){ return false; }
			return searchEngine(value, tagList);
		case "includes any of":
			if(!value || tagList.length == 0){ return false; }
			return value.some(tag => searchEngine(tag, tagList)); // TODO: Does the search config need to be adjusted for exact matching ?
		case "does not include":
			if(!value || tagList.length == 0){ return true; }
			return value.every(tag => !searchEngine(tag, tagList));
		default:
			throw new Error("Invalid relationship for tag query : " + relationship);
		}
	}
	case "type":
		switch(relationship){
		case "is":
			if(!value){ return false; }
			return item.data.itemType == value;
		case "is any of":
			if(!value){ return false; }
			return value.includes(item.data.itemType);
		case "is not":
			if(!value){ return true; }
			return item.data.itemType != value;
		default:
			throw new Error("Invalid relationship for type query : " + relationship);
		}
	case "doi":
		switch(relationship){
		case "exists":
			return item.data.DOI && true;
		case "does not exist":
			return !item.data.DOI;
		default:
			throw new Error("Invalid relationship for DOI query : " + relationship);
		}
	case "citekey":
		switch(relationship){
		case "exists":
			return item.has_citekey && true;
		case "does not exist":
			return !item.has_citekey;
		default:
			throw new Error("Invalid relationship for citekey query : " + relationship);
		}
	case "published": {
		let [from = -Infinity, to = Infinity] = value;
		return (item.data.dateAdded > from && item.data.dateAdded < to);
	}
	case "added": {
		let [from = -Infinity, to = Infinity] = value;
		return (item.data.dateAdded > from && item.data.dateAdded < to);
	}
	default:
		throw new Error("Invalid property for query : " + property);
	}
}

function applyQueries(terms, itemList){
	return itemList.filter(item => eval_and(terms, item));
}

function ExplorerContents({ itemList, onClose }){
	const [filter/*, setFilter*/] = useState("items");
	const [queries/*, setQueries*/] = useState([[{ property: "abstract", relationship: "exists", value: ""}]]);
	const [currentPage, setCurrentPage] = useState(1);
	
	const filteredData = useMemo(() => {
		switch(filter){
		// TODO: Add support for PDF items and notes
		case "items":
		default:
			return itemList.items;
		}
	}, [itemList, filter]);

	const queriedData = useMemo(() => applyQueries(queries, filteredData), [filteredData, queries]);

	const pageLimits = useMemo(() => [itemsPerPage*(currentPage - 1), itemsPerPage*currentPage], [currentPage]);

	useEffect(() => {
		setCurrentPage(1);
	}, [filteredData, queriedData]);

	return <div>
		<Button icon="cross" minimal={true} onClick={onClose} />
		<Toolbar>
			<Pagination 
				currentPage={currentPage} 
				itemsPerPage={itemsPerPage} 
				nbItems={filteredData.length} 
				setCurrentPage={setCurrentPage} 
			/>
		</Toolbar>
		<ListWrapper>
			{filteredData.length > 0
				? filteredData
					.slice(...pageLimits)
					.map((el, i) => <ListItem key={[el.key, i].join("-")}>{el.key}</ListItem>)
				: <NonIdealState className="zr-auxiliary" description="No items to display" />}
		</ListWrapper>
	</div>;
}
ExplorerContents.propTypes = {
	itemList: shape({
		today: arrayOf(customPropTypes.cleanRecentItemType),
		yesterday: arrayOf(customPropTypes.cleanRecentItemType),
		recent: arrayOf(customPropTypes.cleanRecentItemType)
	}),
	onClose: func
};

function Explorer({ onClose }){
	const { dataRequests } = useContext(ExtensionContext);
	const itemQueries = useQuery_Items(dataRequests, {
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const isLoading = itemQueries.some(q => q.isLoading);
	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);

	return <div>
		{isLoading
			? <Spinner />
			: <ExplorerContents itemList={itemList} onClose={onClose} /> }
	</div>;
}
Explorer.propTypes = {
	onClose: func
};

export default Explorer;