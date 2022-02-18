import React, { useCallback, useContext, useMemo, useState } from "react";
import { arrayOf, func } from "prop-types";
import { Button, Classes, Spinner, Tag } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import NoWriteableLibraries from "../../Errors/NoWriteableLibraries";
import { RoamTag } from "./Tags";
import TagsDatalist from "./TagsDatalist";

import { useQuery_Tags, useWriteableLibraries } from "../../../api/queries";
import * as customPropTypes from "../../../propTypes";

const TabContents = React.memo(function TabContents({ libraries, onClose }){
	const [selectedLibrary, setSelectedLibrary] = useState(libraries[0]);

	const { isLoading, data } = useQuery_Tags([selectedLibrary], { 
		notifyOnChangeProps: ["data"], 
		select: (datastore) => datastore.data
	})[0];
	
	const libOptions = useMemo(() => libraries.map(lib => lib.path), [libraries]);
	const handleLibrarySelect = useCallback((path) => setSelectedLibrary(libraries.find(lib => lib.path == path)), [libraries]);
	const libProps = useMemo(() => {
		return {
			currentLibrary: selectedLibrary,
			onSelect: handleLibrarySelect,
			options: libOptions
		};
	}, [handleLibrarySelect, libOptions, selectedLibrary]);

	return (
		<>
			<div className={["zr-tagmanager--header", "zr-auxiliary"].join(" ")}>
				<span>
					Rename, merge, and delete tags between <RoamTag text="Roam" /> and <Tag active={true} className={["zr-tag--zotero", Classes.ACTIVE, Classes.MINIMAL].join(" ")}>Zotero</Tag>
				</span>
				<Button icon="small-cross" minimal={true} onClick={onClose} />
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
	libraries: arrayOf(customPropTypes.zoteroLibraryType),
	onClose: func
};

const TagManager = React.memo(function TagManager({ onClose }){
	const { libraries } = useContext(ExtensionContext);
	const { data: writeableLibraries, isLoading } = useWriteableLibraries(libraries);

	return (
		isLoading
			? <Spinner />
			: writeableLibraries.length == 0
				? <NoWriteableLibraries />
				: <TabContents libraries={writeableLibraries} onClose={onClose} />
	);
});
TagManager.propTypes = {
	onClose: func
};

export default TagManager;
