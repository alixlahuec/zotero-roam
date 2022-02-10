import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { arrayOf, shape } from "prop-types";
import { Button, ButtonGroup, Callout, ControlGroup, NonIdealState, Spinner } from "@blueprintjs/core";

import SortButtons from "../SortButtons";
import { ExtensionContext } from "../App";

import { useQuery_Tags, useWriteableLibraries } from "../../api/queries";
import { getTagStats, getTagUsage, matchTagData, pluralize, sortTags } from "../../utils";
import * as customPropTypes from "../../propTypes";
import { number } from "prop-types";

const itemsPerPage = 30;

// TODO: Convert to globally accessible constant
const NoWriteableLibraries = <Callout>No writeable libraries were found. Please check that your API key(s) have the permission to write to at least one of the Zotero libraries you use. <a href="https://app.gitbook.com/@alix-lahuec/s/zotero-roam/getting-started/prereqs#zotero-api-credentials" target="_blank" rel="noreferrer">Refer to the extension docs</a> for more details.</Callout>;

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
	const is_singleton = entry.zotero.length == 1 && (entry.roam.length == 0 || (entry.roam.length == 1 && entry.zotero[0].tag == entry.roam[0].title));

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
	const { items } = props;
	const [currentPage, setCurrentPage] = useState(1);
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

	const nbPages = useMemo(() => !matchedTags ? 0 : Math.ceil(matchedTags.length / itemsPerPage), [matchedTags]);
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

	const sortedItems = useMemo(() => {
		if(!matchedTags){
			return [];
		} else {
			return sortTags(matchedTags, sortBy);
		}
	}, [matchedTags, sortBy]);

	return (
		matchedTags == null
			? <NonIdealState icon="refresh" title="Loading tags" />
			: <>
				<div className="zr-datalist--toolbar">
					<SortButtons name="zr-tagmanager-sort" onSelect={handleSort} options={sortOptions} selectedOption={sortBy} />
					<div className="zr-datalist--pagination">
						<span className="zr-text-small" zr-role="items-count">
							<strong>{(currentPage - 1)*30 + 1}-{Math.min(currentPage*30, matchedTags.length)}</strong> / {matchedTags.length} entries
						</span>
						<ControlGroup>
							<Button disabled={currentPage == 1} icon="chevron-left" minimal={true} onClick={previousPage} />
							<Button disabled={currentPage == nbPages} icon="chevron-right" minimal={true} onClick={nextPage} />
						</ControlGroup>
					</div>
				</div>
				{sortedItems.slice(itemsPerPage*(currentPage - 1), itemsPerPage*currentPage).map(el => <DatalistItem key={el.token} entry={el} />)}
				<Stats stats={stats} />
			</>
	);
});
TagsDatalist.propTypes = {
	items: arrayOf(customPropTypes.taglistEntry)
};

const TabContents = React.memo(function TabContents(props){
	const { libraries } = props;
	const [selectedLibrary,] = useState(libraries[0]);

	const { isLoading, data } = useQuery_Tags([selectedLibrary], { 
		notifyOnChangeProps: ["data"], 
		select: (datastore) => datastore.data
	})[0];

	return (
		<>
			<div className={["zr-tagmanager--header", "zr-auxiliary"].join(" ")}>
                Rename, merge, and delete tags between <span data-tag-source="roam">Roam</span> and <span data-tag-source="zotero">Zotero</span>
			</div>
			<div className="zr-tagmanager--datalist">
				{isLoading
					? <Spinner />
					: <TagsDatalist items={data} /> }
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
