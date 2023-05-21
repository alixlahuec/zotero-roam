import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { NonIdealState, Spinner } from "@blueprintjs/core";

import { ListWrapper, Pagination, Toolbar } from "Components/DataList";
import SortButtons, { SortOption } from "Components/DataList/SortButtons";
import ItemEntry from "./ItemEntry";
import ItemSuggestion from "./ItemSuggestion";
import Stats from "../Stats";

import { TagsSortBy, getTagStats, isSingleton, matchTagData, sortTags } from "../utils";
import { usePagination } from "../../../../hooks";

import { CustomClasses } from "../../../../constants";
import { ZLibrary, ZTagEntry, ZTagList, ZTagStats } from "Types/transforms";
import "./index.css";


const itemsPerPage = 30;

const sortOptions: SortOption[] = [
	{ icon: "sort-desc", label: "Most Used", value: "usage" },
	{ icon: "sort-alphabetical", label: "Name", value: "alphabetical" },
	{ icon: "star", label: "In Roam", value: "roam" }
];


type OwnProps = {
	filter: "all" | "suggestions",
	items: ZTagList | undefined,
	library: ZLibrary
};

const TagsDatalist = memo<OwnProps>(function TagsDatalist({ filter, items, library }){
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });
	const [sortBy, setSortBy] = useState<TagsSortBy>("usage");
	const [matchedTags, setMatchedTags] = useState<ZTagEntry[]>();
	const [stats, setStats] = useState<ZTagStats>();

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

	const filteredItems = useMemo<ZTagEntry[]>(() => {
		if(!matchedTags){
			return [];
		} else {
			if(filter == "suggestions"){
				return matchedTags.filter(el => !isSingleton(el));
			} else {
				return matchedTags;
			}
		}
	}, [filter, matchedTags]);

	const handleSort = useCallback((value) => {
		setSortBy(() => value);
		setCurrentPage(1);
	}, [setCurrentPage]);

	const sortedItems = useMemo(() => sortTags(filteredItems, sortBy), [filteredItems, sortBy]);

	return (
		matchedTags == null
			? <Spinner size={15} />
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
										? <ItemSuggestion key={el.token} entry={el} library={library} /> 
										: <ItemEntry key={el.token} entry={el} library={library} />)}
						</ListWrapper>
					}
				</div>
				{filter == "all" && <Stats stats={stats} />}
			</div>
	);
});


export default TagsDatalist;
