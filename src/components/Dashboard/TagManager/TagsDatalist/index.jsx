import { arrayOf, func, objectOf, oneOf, shape, string } from "prop-types";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { NonIdealState, Spinner } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "../../../DataList";
import ItemEntry from "./ItemEntry";
import ItemSuggestion from "./ItemSuggestion";
import SortButtons from "../../../SortButtons";
import Stats from "../Stats";

import { getTagStats, isSingleton, matchTagData, sortTags } from "../utils";
import usePagination from "../../../../hooks/usePagination";

import { CustomClasses } from "../../../../constants";

import * as customPropTypes from "../../../../propTypes";

import "./index.css";

const itemsPerPage = 30;

const TagsDatalist = memo(function TagsDatalist(props){
	const { filter, items, libProps } = props;
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });
	const [sortBy, setSortBy] = useState("usage");
	const [matchedTags, setMatchedTags] = useState(null);
	const [stats, setStats] = useState(null);

	useEffect(() => {
		if(items) {
			matchTagData(items)
				.then(data => {
					setMatchedTags(data);
					setStats(() => getTagStats(data));
				});
			setCurrentPage(1);
		}
	}, [items, setCurrentPage]);

	const filteredItems = useMemo(() => {
		if(!matchedTags){
			return [];
		} else {
			if(filter == "suggestions"){
				return matchedTags.filter(el => !isSingleton(el));
			} else if(filter == "all"){
				return matchedTags;
			}
		}
	}, [filter, matchedTags]);

	const handleSort = useCallback((value) => {
		setSortBy(() => value);
		setCurrentPage(1);
	}, [setCurrentPage]);
    
	const sortOptions = useMemo(() => [
		{ icon: "sort-desc", label: "Most Used", value: "usage" },
		{ icon: "sort-alphabetical", label: "Name", value: "alphabetical" },
		{ icon: "star", label: "In Roam", value: "roam" }
	], []);

	const sortedItems = useMemo(() => sortTags(filteredItems, sortBy), [filteredItems, sortBy]);

	return (
		matchedTags == null
			? <Spinner size={15} title="Loading tags data..." />
			: <div className="zr-tagmanager--datalist" >
				<Toolbar>
					<SortButtons name={"zr-tagmanager-sort-" + filter} onSelect={handleSort} options={sortOptions} selectedOption={sortBy} />
					<Pagination 
						currentPage={currentPage} 
						itemsPerPage={itemsPerPage} 
						nbItems={filteredItems.length} 
						setCurrentPage={setCurrentPage} />
				</Toolbar>
				<div className="zr-tagmanager--datalist--contents">
					{sortedItems.length == 0
						? <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No items to display" />
						: <ListWrapper>
							{sortedItems
								.slice(...pageLimits)
								.map(el =>
									filter == "suggestions" 
										? <ItemSuggestion key={el.token} entry={el} library={libProps.currentLibrary} /> 
										: <ItemEntry key={el.token} entry={el} library={libProps.currentLibrary} />)}
						</ListWrapper>
					}
				</div>
				{filter == "all" && <Stats stats={stats} />}
			</div>
	);
});
TagsDatalist.propTypes = {
	filter: oneOf(["all", "suggestions"]),
	items: objectOf(arrayOf(customPropTypes.taglistEntry)),
	libProps: shape({
		currentLibrary: customPropTypes.zoteroLibraryType,
		onSelect: func,
		options: arrayOf(string)
	})
};

export default TagsDatalist;
