import React, { useCallback, useEffect, useMemo, useState} from "react";
import { arrayOf, func, objectOf, oneOf, shape, string } from "prop-types";
import { Button, Icon, NonIdealState, Spinner, Tag} from "@blueprintjs/core";

import { ListItem, ListWrapper, Pagination, Toolbar } from "../../DataList";
import SuggestionActions from "./SuggestionActions";
import SortButtons from "../../SortButtons";
import Stats from "./Stats";
import { RoamTag, ZoteroTag } from "./Tags";

import { pluralize } from "../../../utils";
import { getTagUsage, getTagStats, matchTagData, sortTags } from "./utils";

import * as customPropTypes from "../../../propTypes";

const itemsPerPage = 30;
const isSingleton = (entry) => entry.zotero.length == 1 && (entry.roam.length == 0 || (entry.roam.length == 1 && entry.zotero[0].tag == entry.roam[0].title));

const ItemEntry = React.memo(function ItemEntry({ entry/*, library*/ }){
	const is_singleton = isSingleton(entry);
	const usage = getTagUsage(entry);
	const [isCollapsed, setIsCollapsed] = useState(true);
	const toggleCollapse = useCallback(() => setIsCollapsed(prevState => !prevState), []);

	return (
		<ListItem className="zr-tag-entry" data-token={entry.token} in-graph={(entry.roam.length > 0).toString()}>
			<span zr-role="item-header">
				<span className="zr-auxiliary" zr-role="title">{entry.token}</span>
				<span className={["zr-secondary", "zr-text-small"].join(" ")}>{pluralize(usage, "item")}</span>
				<span zr-role="item-actions">
					<Button icon={isCollapsed ? "chevron-down" : "chevron-up"} minimal={true} onClick={toggleCollapse} />
				</span>
			</span>
			{!is_singleton && <span className="zr-text-small" zr-role="item-additional">
				{entry.roam.map(elem => <RoamTag key={elem.title} text={elem.title} uid={elem.uid} /> )}
				{entry.zotero.map((elem) => {
					const { tag, meta: { type }} = elem;
					return <ZoteroTag key={[tag, type].join("_")} tagElement={elem} />;
				} )}
			</span>}
			<span zr-role="item-details" is-collapsed={isCollapsed.toString()} >
				Lorem ipsum
			</span>
		</ListItem>
	);
});
ItemEntry.propTypes = {
	entry: customPropTypes.taglistEntry,
	library: customPropTypes.zoteroLibraryType
};

const ItemSuggestion = React.memo(function ItemSuggestion({ entry, library }){
	const [isCollapsed, setIsCollapsed] = useState(true);
	const toggleCollapse = useCallback(() => setIsCollapsed(prevState => !prevState), []);

	return (
		<ListItem className="zr-tag-suggestion" data-token={entry.token} in-graph={(entry.roam.length > 0).toString()}>
			<span zr-role="item-header">
				{entry.roam.length > 0
					? <Icon htmlTitle={"This tag exists in Roam as (" + entry.roam.map(el => el.title).join(", ") + ")"} icon="endorsed" />
					: <Icon icon="blank" />}
				<span className="zr-auxiliary" zr-role="title">{entry.token}</span>
				<Tag htmlTitle={entry.zotero.map(t => t.tag).join(" - ")} intent="warning" icon="tag" minimal={true}>{pluralize(entry.zotero.length, "tag")}</Tag>
				<span zr-role="item-actions">
					<SuggestionActions entry={entry} library={library} />
					<Button icon={isCollapsed ? "chevron-down" : "chevron-up"} minimal={true} onClick={toggleCollapse} />
				</span>
			</span>
			<span zr-role="item-details" is-collapsed={isCollapsed.toString()} >
				Lorem ipsum
			</span>
		</ListItem>
	);
});
ItemSuggestion.propTypes = {
	entry: customPropTypes.taglistEntry,
	library: customPropTypes.zoteroLibraryType
};

const TagsDatalist = React.memo(function TagsDatalist(props){
	const { filter, items, libProps } = props;
	const [currentPage, setCurrentPage] = useState(1);
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
					<Pagination 
						currentPage={currentPage} 
						itemsPerPage={itemsPerPage} 
						nbItems={filteredItems.length} 
						setCurrentPage={setCurrentPage} />
				</Toolbar>
				<ListWrapper>
					{sortedItems.length > 0
						? sortedItems
							.slice(...pageLimits)
							.map(el =>
								filter == "suggestions" 
									? <ItemSuggestion key={el.token} entry={el} library={libProps.currentLibrary} /> 
									: <ItemEntry key={el.token} entry={el} library={libProps.currentLibrary} />)
						: <NonIdealState className="zr-auxiliary" description="No items in the current view" />}
				</ListWrapper>
				{filter == "all" && <Stats stats={stats} />}
			</>
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
