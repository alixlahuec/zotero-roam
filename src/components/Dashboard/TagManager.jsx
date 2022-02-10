import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { arrayOf, func, shape, string } from "prop-types";
import { Button, ButtonGroup, Callout, Classes, ControlGroup, NonIdealState, Spinner, Switch } from "@blueprintjs/core";

import SortButtons from "../SortButtons";
import { ExtensionContext } from "../App";

import { useQuery_Tags, useWriteableLibraries } from "../../api/queries";
import { getTagStats, getTagUsage, matchTagData, pluralize, sortTags } from "../../utils";
import * as customPropTypes from "../../propTypes";
import { number } from "prop-types";

const itemsPerPage = 30;

// TODO: Convert to globally accessible constant
const NoWriteableLibraries = <Callout>No writeable libraries were found. Please check that your API key(s) have the permission to write to at least one of the Zotero libraries you use. <a href="https://app.gitbook.com/@alix-lahuec/s/zotero-roam/getting-started/prereqs#zotero-api-credentials" target="_blank" rel="noreferrer">Refer to the extension docs</a> for more details.</Callout>;

const isSingleton = (entry) => entry.zotero.length == 1 && (entry.roam.length == 0 || (entry.roam.length == 1 && entry.zotero[0].tag == entry.roam[0].title));

function ZoteroTag({ tagElement }){
	const { tag, meta: { numItems, type = 0 } } = tagElement;

	return (
		<span data-tag-source="zotero" data-tag={tag} data-tag-type={type} >
			{tag} ({numItems})
		</span>
	);
}
ZoteroTag.propTypes = {
	tagElement: customPropTypes.zoteroTagType
};

const DatalistItem = React.memo(function DatalistItem({ entry }){
	const is_singleton = isSingleton(entry);
	const usage = getTagUsage(entry);

	return (
		<div className="zr-datalist--item" data-token={entry.token} in-graph={(entry.roam.length > 0).toString()}>
			<div>
				<span className="zr-auxiliary" zr-role="title">{entry.token}</span>
				<span className={["zr-secondary", "zr-text-small"].join(" ")}>{pluralize(usage, "item")}</span>
				{is_singleton
					? null
					: <div zr-role="taglist" className="zr-text-small">
						{entry.roam.map(elem => <span key={elem.title} data-tag={elem.title} data-uid={elem.uid} data-tag-source="roam" >{elem.title}</span> )}
						{entry.zotero.map((elem) => <ZoteroTag key={[elem.tag, elem.meta.type].join("_")} tagElement={elem} /> )}
					</div>}
			</div>
			<span className="zr-datalist--item-actions">
				<ButtonGroup minimal={true} >
					<Button className="zr-text-small" icon="git-merge" intent="primary" text="Edit" />
					<Button className="zr-text-small" intent="danger" text="Delete" />
				</ButtonGroup>
			</span>
		</div>
	);
});
DatalistItem.propTypes = {
	entry: customPropTypes.taglistEntry
};

const LibrarySelect = React.memo(function LibrarySelect({ libProps }){
	const { currentPath, options } = libProps;
	const handleSelect = useCallback((event) => {
		// For testing
		let target = event.currentTarget;
		let value = event.currentTarget?.value;
		console.log(target, value);
	}, []);

	return (
		<div className={ Classes.MINIMAL }>
			<select onChange={handleSelect} value={currentPath}>
				{options.map(op => <option key={op} value={op}>{op}</option>)}
			</select>
		</div>
	);
});
LibrarySelect.propTypes = {
	libProps: shape({
		currentPath: string,
		onSelect: func,
		options: arrayOf(string)
	})
};

const Stats = React.memo(function Stats({ stats }){
	if(!stats){
		return null;
	} else {
		const { nTags, nRoam, nAuto, nTotal} = stats;
		return (
			<div className={["zr-datalist--stats", "zr-auxiliary", "zr-text-small"].join(" ")}>
				<span>
					Zotero has {nTags} tags ({nAuto} / {Math.round(nAuto / nTags*100)}% automatic), matched in {nTotal} groups
				</span>
				<span>
					{nRoam} are in Roam ({Math.round(nRoam / nTotal *100)}%)
				</span>
			</div>
		);
	}
});
Stats.propTypes = {
	stats: shape({
		nAuto: number,
		nRoam: number,
		nTags: number,
		nTotal: number
	})
};

const TagsDatalist = React.memo(function ItemRenderer(props){
	const { items, libProps } = props;
	const [currentPage, setCurrentPage] = useState(1);
	const [filter, setFilter] = useState("select");
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

	const nbPages = useMemo(() => filteredItems.length == 0 ? 0 : Math.ceil(filteredItems.length / itemsPerPage), [filteredItems.length]);
	const previousPage = useCallback(() => setCurrentPage((current) => current > 1 ? (current - 1) : current), []);
	const nextPage = useCallback(() => setCurrentPage((current) => current < nbPages ? (current + 1) : current), [nbPages]);

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
			? <NonIdealState icon="refresh" title="Loading tags" />
			: <>
				<div className="zr-datalist--toolbar">
					<SortButtons name="zr-tagmanager-sort" onSelect={handleSort} options={sortOptions} selectedOption={sortBy} />
					<LibrarySelect libProps={libProps} />
				</div>
				<div className="zr-datalist--listwrapper">
					{sortedItems.slice(itemsPerPage*(currentPage - 1), itemsPerPage*currentPage).map(el => <DatalistItem key={el.token} entry={el} />)}
				</div>
				<div className="zr-datalist--toolbar">
					<Switch checked={filter == "all"} className="zr-text-small" label="Show all tags" onChange={handleFilter} />
					<div className="zr-datalist--pagination">
						<span className="zr-text-small" zr-role="items-count">
							<strong>{(currentPage - 1)*30 + 1}-{Math.min(currentPage*30, filteredItems.length)}</strong> / {filteredItems.length} entries
						</span>
						<ControlGroup>
							<Button disabled={currentPage == 1} icon="chevron-left" minimal={true} onClick={previousPage} />
							<Button disabled={currentPage == nbPages} icon="chevron-right" minimal={true} onClick={nextPage} />
						</ControlGroup>
					</div>
				</div>
				<Stats stats={stats} />
			</>
	);
});
TagsDatalist.propTypes = {
	items: arrayOf(customPropTypes.taglistEntry),
	libProps: shape({
		currentPath: string,
		onSelect: func,
		options: arrayOf(string)
	})
};

const TabContents = React.memo(function TabContents(props){
	const { libraries } = props;
	const [selectedLibrary, setSelectedLibrary] = useState(libraries[0]);

	const { isLoading, data } = useQuery_Tags([selectedLibrary], { 
		notifyOnChangeProps: ["data"], 
		select: (datastore) => datastore.data
	})[0];
	
	const libOptions = useMemo(() => libraries.map(lib => lib.path), [libraries]);
	const handleLibrarySelect = useCallback((path) => setSelectedLibrary(libraries.find(lib => lib.path == path)), [libraries]);
	const libProps = useMemo(() => {
		return {
			currentPath: selectedLibrary.path,
			onSelect: handleLibrarySelect,
			options: libOptions
		};
	}, [handleLibrarySelect, libOptions, selectedLibrary.path]);

	return (
		<>
			<div className={["zr-tagmanager--header", "zr-auxiliary"].join(" ")}>
                Rename, merge, and delete tags between <span data-tag-source="roam">Roam</span> and <span data-tag-source="zotero">Zotero</span>
			</div>
			<div className="zr-tagmanager--datalist">
				{isLoading
					? <Spinner />
					: <TagsDatalist items={data} libProps={libProps} /> }
			</div>
		</>
	);
});
TabContents.propTypes = {
	libraries: arrayOf(customPropTypes.zoteroLibraryType)
};

const TagManager = React.memo(function TagManager(){
	const { libraries } = useContext(ExtensionContext);
	const { data: writeableLibraries, isLoading } = useWriteableLibraries(libraries);

	return (
		isLoading
			? <Spinner />
			: writeableLibraries.length == 0
				? <NoWriteableLibraries />
				: <TabContents libraries={writeableLibraries} />
	);
});
TagManager.propTypes = {
	
};

export default TagManager;
