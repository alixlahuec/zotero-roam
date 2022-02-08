import React, { useCallback, useContext, useMemo, useState } from "react";
import { arrayOf } from "prop-types";
import { Callout, HTMLSelect, MenuItem, Spinner } from "@blueprintjs/core";

import SortButtons from "../SortButtons";
import { ExtensionContext } from "../App";

import { useQuery_Tags, useWriteableLibraries } from "../../api/queries";
import { matchTagData, sortTags } from "../../utils";
import * as customPropTypes from "../../propTypes";

// TODO: Convert to globally accessible constant
const NoWriteableLibraries = <Callout>No writeable libraries were found. Please check that your API key(s) have the permission to write to at least one of the Zotero libraries you use. <a href="https://app.gitbook.com/@alix-lahuec/s/zotero-roam/getting-started/prereqs#zotero-api-credentials" target="_blank" rel="noreferrer">Refer to the extension docs</a> for more details.</Callout>;

const DatalistItem = React.memo(function DatalistItem({ entry }){
	return (
		<MenuItem className="zr-datalist--item" multiline={true} tagName="span" text={entry.token} />
	);
});
DatalistItem.propTypes = {
	entry: customPropTypes.taglistEntry
};

const TagsDatalist = React.memo(function TagsDatalist(props){
	const { libraries } = props;
	const [selectedLibrary, /* Removed setter for now, due to select not working */] = useState(libraries[0]);
	const [sortBy, setSortBy] = useState("usage");

	const handleLibrarySelect = useCallback((event) => {
		// For debugging
		console.log(event);
	}, []);
    
	const sortOptions = useMemo(() => [
		{ icon: "sort-desc", label: "Most Used", value: "usage" },
		{ icon: "sort-alphabetical", label: "Name", value: "alphabetical"},
		{ icon: "star", label: "In Roam", value: "roam" }
	], []);

	const { isLoading, data } = useQuery_Tags([selectedLibrary], { 
		notifyOnChangeProps: ["data"], 
		select: (datastore) => matchTagData(datastore.data).slice(10)
	})[0];

	const sortedItems = useMemo(() => data ? sortTags(data, sortBy) : [], [data, sortBy]);

	return (
		<>
			<div className={["zr-tagmanager--header", "zr-auxiliary"].join(" ")}>
                Rename, merge, and delete tags between <span data-tag-source="roam">Roam</span> and <span data-tag-source="zotero">Zotero</span>
			</div>
			<div className="zr-tagmanager--datalist">
				<div className="zr-datalist--toolbar">
					<SortButtons name="zr-tagmanager-sort" onSelect={setSortBy} options={sortOptions} selectedOption={sortBy} />
					<HTMLSelect defaultValue={selectedLibrary.path} minimal={true} onChange={handleLibrarySelect} options={libraries.map(lib => lib.path)} />
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
