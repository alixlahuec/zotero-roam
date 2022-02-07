import React, { useCallback, useContext, useMemo, useState } from "react";
import { arrayOf } from "prop-types";
import { Callout, HTMLSelect, Spinner } from "@blueprintjs/core";

import SortButtons from "../SortButtons";
import { ExtensionContext } from "../App";

import { useWriteableLibraries } from "../../api/queries";
import * as customPropTypes from "../../propTypes";

// TODO: Convert to globally accessible constant
const NoWriteableLibraries = <Callout>No writeable libraries were found. Please check that your API key(s) have the permission to write to at least one of the Zotero libraries you use. <a href="https://app.gitbook.com/@alix-lahuec/s/zotero-roam/getting-started/prereqs#zotero-api-credentials" target="_blank" rel="noreferrer">Refer to the extension docs</a> for more details.</Callout>;

const TagsDatalist = React.memo(function TagsDatalist(props){
	const { libraries } = props;
	const [selectedLibrary, setSelectedLibrary] = useState(libraries[0]);
	const [sortBy, setSortBy] = useState("usage");

	const libOptions = useMemo(() => libraries.map(lib => ({ value: lib.path })), [libraries]);
    
	const sortOptions = useMemo(() => [
		{ icon: "sort-desc", label: "Most Used", value: "usage" },
		{ icon: "sort-alphabetical", label: "Name", value: "alphabetical"},
		{ icon: "star", label: "In Roam", value: "roam" }
	], []);

	const handleLibrarySelect = useCallback((event) => {
		let path = event.target.currentValue;
		setSelectedLibrary(libraries.find(lib => lib.path == path));
	}, [libraries]);

	return (
		<>
			<div className={["zr-tagmanager--header", "zr-auxiliary"].join(" ")}>
                Rename, merge, and delete tags between <span data-tag-source="roam">Roam</span> and <span data-tag-source="zotero">Zotero</span>
			</div>
			<div className="zr-tagmanager--datalist">
				<div className="zr-datalist--toolbar">
					<SortButtons name="zr-tagmanager-sort" onSelect={setSortBy} options={sortOptions} selectedOption={sortBy} />
					<HTMLSelect minimal={true} onChange={handleLibrarySelect} options={libOptions} value={selectedLibrary.path} />
				</div>
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
