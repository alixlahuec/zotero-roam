import React, { useCallback, useEffect, useMemo, useState} from "react";
import { arrayOf, func, shape, string } from "prop-types";
import { Button, ButtonGroup, NonIdealState, Spinner, Switch } from "@blueprintjs/core";

import { ListItem, ListWrapper, Pagination, Toolbar } from "../../DataList";
import LibrarySelect from "./LibrarySelect";
import MergeInput from "./MergeInput";
import SortButtons from "../../SortButtons";
import Stats from "./Stats";
import { RoamTag, ZoteroTag } from "./Tags";

import { useDeleteTags } from "../../../api/write";
import { pluralize } from "../../../utils";
import { getTagUsage, getTagStats, matchTagData, sortTags } from "./utils";

import * as customPropTypes from "../../../propTypes";

const itemsPerPage = 30;
const isSingleton = (entry) => entry.zotero.length == 1 && (entry.roam.length == 0 || (entry.roam.length == 1 && entry.zotero[0].tag == entry.roam[0].title));

const Item = React.memo(function Item({ entry, library }){
	const [selectedTags, setSelectedTags] = useState(Array.from(new Set(entry.zotero.map(t => t.tag))));
	const { mutate, status: deleteStatus } = useDeleteTags();
	
	const is_singleton = isSingleton(entry);
	const usage = getTagUsage(entry);

	const handleSelect = useCallback((tag) => {
		setSelectedTags(prevSelection => {
			if(prevSelection.includes(tag)){
				return prevSelection.filter(el => el != tag);
			} else {
				return [...prevSelection, tag];
			}
		});
	}, []);

	const triggerDelete = useCallback(() => {
		mutate({
			library,
			tags: selectedTags
		}, {
			onSettled: (data, error, variables) => console.log(data, error, variables)
		});
	}, [library, mutate, selectedTags]);

	return (
		<ListItem data-token={entry.token} in-graph={(entry.roam.length > 0).toString()}>
			<div>
				<span className="zr-auxiliary" zr-role="title">{entry.token}</span>
				<span className={["zr-secondary", "zr-text-small"].join(" ")}>{pluralize(usage, "item")}</span>
				{is_singleton
					? null
					: <div className="zr-text-small">
						{entry.roam.map(elem => <RoamTag key={elem.title} text={elem.title} uid={elem.uid} /> )}
						{entry.zotero.map((elem) => {
							const { tag, meta: { type }} = elem;
							return <ZoteroTag key={[tag, type].join("_")} handleSelect={handleSelect} isSelected={selectedTags.includes(tag)} tagElement={elem} />;
						} )}
					</div>}
			</div>
			<span zr-role="item-actions" >
				<ButtonGroup minimal={true} vertical={!is_singleton} >
					{is_singleton
						? <>
							<Button intent="primary" small={true} text="Edit" />
							<Button 
								icon="trash" 
								intent="danger" 
								loading={deleteStatus == "loading"} 
								onClick={triggerDelete} 
								small={true}
								text="Delete" />
						</>
						: <>
							<MergeInput 
								defaultValue={entry.roam[0]?.title || ""} 
								disabled={deleteStatus == "loading"} 
								library={library} 
								selectedTags={selectedTags} />
							<Button 
								className="zr-text-small" 
								disabled={selectedTags.length == 0} 
								icon="trash" 
								intent="danger"
								loading={deleteStatus == "loading"}
								onClick={triggerDelete} 
								text="Delete" />
						</>}
				</ButtonGroup>
			</span>
		</ListItem>
	);
});
Item.propTypes = {
	entry: customPropTypes.taglistEntry,
	library: customPropTypes.zoteroLibraryType
};

const TagsDatalist = React.memo(function ItemRenderer(props){
	const { items, libProps } = props;
	const [currentPage, setCurrentPage] = useState(1);
	const [filter, setFilter] = useState("select");
	const [sortBy, setSortBy] = useState("usage");
	const [matchedTags, setMatchedTags] = useState(null);
	const [stats, setStats] = useState(null);

	const pageLimits = useMemo(() => [itemsPerPage*(currentPage - 1), itemsPerPage*currentPage], [currentPage]);

	useEffect(() => {
		if(items) {
			matchTagData(items)
				.then(data => {
					setMatchedTags(data);
					setStats(() => getTagStats(data));
				});
			setCurrentPage(1);
		}
	}, [items]);

	const handleFilter = useCallback((_event) => {
		setFilter((prevFilter) => prevFilter == "select" ? "all" : "select");
	}, []);

	const filteredItems = useMemo(() => {
		if(!matchedTags){
			return [];
		} else {
			if(filter == "select"){
				return matchedTags.filter(el => !isSingleton(el));
			} else if(filter == "all"){
				return matchedTags;
			}
		}
	}, [filter, matchedTags]);

	const handleSort = useCallback((value) => {
		setSortBy(() => value);
		setCurrentPage(1);
	}, []);
    
	const sortOptions = useMemo(() => [
		{ icon: "sort-desc", label: "Most Used", value: "usage" },
		{ icon: "sort-alphabetical", label: "Name", value: "alphabetical"},
		{ icon: "star", label: "In Roam", value: "roam" }
	], []);

	const sortedItems = useMemo(() => sortTags(filteredItems, sortBy), [filteredItems, sortBy]);

	return (
		matchedTags == null
			? <Spinner size={15} />
			: <>
				<Toolbar>
					<SortButtons name="zr-tagmanager-sort" onSelect={handleSort} options={sortOptions} selectedOption={sortBy} />
					<LibrarySelect libProps={libProps} />
				</Toolbar>
				<ListWrapper>
					{sortedItems.length > 0
						? sortedItems
							.slice(...pageLimits)
							.map(el => 
								<Item key={el.token} entry={el} library={libProps.currentLibrary} />)
						: <NonIdealState className="zr-auxiliary" description="No items in the current view" />}
				</ListWrapper>
				<Toolbar>
					<Switch checked={filter == "all"} className="zr-text-small" label="Show all tags" onChange={handleFilter} />
					<Pagination 
						currentPage={currentPage} 
						itemsPerPage={itemsPerPage} 
						nbItems={filteredItems.length} 
						setCurrentPage={setCurrentPage} />
				</Toolbar>
				{filter == "all" && <Stats stats={stats} />}
			</>
	);
});
TagsDatalist.propTypes = {
	items: arrayOf(customPropTypes.taglistEntry),
	libProps: shape({
		currentLibrary: customPropTypes.zoteroLibraryType,
		onSelect: func,
		options: arrayOf(string)
	})
};

export default TagsDatalist;
