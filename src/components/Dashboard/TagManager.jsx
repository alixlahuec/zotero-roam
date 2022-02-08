import React, { useContext, useMemo, useState } from "react";
import { arrayOf } from "prop-types";
import { Button, ButtonGroup, Callout, Spinner } from "@blueprintjs/core";

import SortButtons from "../SortButtons";
import { ExtensionContext } from "../App";

import { useQuery_Tags, useWriteableLibraries } from "../../api/queries";
import { matchTagData, sortTags } from "../../utils";
import * as customPropTypes from "../../propTypes";

// TODO: Convert to globally accessible constant
const NoWriteableLibraries = <Callout>No writeable libraries were found. Please check that your API key(s) have the permission to write to at least one of the Zotero libraries you use. <a href="https://app.gitbook.com/@alix-lahuec/s/zotero-roam/getting-started/prereqs#zotero-api-credentials" target="_blank" rel="noreferrer">Refer to the extension docs</a> for more details.</Callout>;

const DatalistItem = React.memo(function DatalistItem({ entry }){
	let is_singleton = entry.zotero.length == 1 && (entry.roam.length == 0 || (entry.roam.length == 1 && entry.zotero[0].tag == entry.roam[0].title));

	return (
		<div className="zr-datalist--item" data-token={entry.token} in-graph={(entry.roam.length > 0).toString()}>
			<div>
				<span zr-role="title">{entry.token}</span>
				<span className={["zr-auxiliary", "zr-text-small"].join(" ")}>XX items</span>
				<div zr-role="taglist" className="zr-text-small">
					{is_singleton
						? null
						: entry.roam.map(elem => <span key={elem.title} data-tag={elem.title} data-uid={elem.uid} data-tag-source="roam" >{elem.title}</span> )}
					{is_singleton
						? null
						: entry.zotero.map((elem,i) => <span key={i}>{elem}</span>)}
				</div>
			</div>
			<span>
				<ButtonGroup minimal={true} >
					<Button icon="git-merge" intent="primary" text="Edit" />
					<Button intent="danger" text="Delete" />
				</ButtonGroup>
			</span>
		</div>
	);
});
DatalistItem.propTypes = {
	entry: customPropTypes.taglistEntry
};

const TagsDatalist = React.memo(function TagsDatalist(props){
	const { libraries } = props;
	const [selectedLibrary, /* Removed setter for now, due to select not working */] = useState(libraries[0]);
	const [sortBy, setSortBy] = useState("usage");
    
	const sortOptions = useMemo(() => [
		{ icon: "sort-desc", label: "Most Used", value: "usage" },
		{ icon: "sort-alphabetical", label: "Name", value: "alphabetical"},
		{ icon: "star", label: "In Roam", value: "roam" }
	], []);

	const { isLoading, data } = useQuery_Tags([selectedLibrary], { 
		notifyOnChangeProps: ["data"], 
		select: (datastore) => matchTagData(datastore.data)
	})[0];

	const sortedItems = useMemo(() => data ? sortTags(data.slice(0,20), sortBy) : [], [data, sortBy]);

	return (
		<>
			<div className={["zr-tagmanager--header", "zr-auxiliary"].join(" ")}>
                Rename, merge, and delete tags between <span data-tag-source="roam">Roam</span> and <span data-tag-source="zotero">Zotero</span>
			</div>
			<div className="zr-tagmanager--datalist">
				<div className="zr-datalist--toolbar">
					<SortButtons name="zr-tagmanager-sort" onSelect={setSortBy} options={sortOptions} selectedOption={sortBy} />
				</div>
				{isLoading
					? <Spinner />
					: sortedItems.map(el => <DatalistItem key={el.token} entry={el} />)}
			</div>
		</>
	);
});
TagsDatalist.propTypes = {
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
				: <TagsDatalist libraries={writeableLibraries} />
	);
});
TagManager.propTypes = {
	
};

export default TagManager;
