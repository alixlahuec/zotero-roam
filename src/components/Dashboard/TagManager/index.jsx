import React, { useCallback, useContext, useMemo, useState } from "react";
import { arrayOf, func, objectOf, shape, string } from "prop-types";
import { Spinner, Tab, Tabs} from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import NoWriteableLibraries from "../../Errors/NoWriteableLibraries";
import SentryBoundary from "../../Errors/SentryBoundary";
import LibrarySelect from "../LibrarySelect";
import TagsDatalist from "./TagsDatalist";

import { useQuery_Tags, useWriteableLibraries } from "../../../api/queries";

import { CustomClasses } from "../../../constants";
import * as customPropTypes from "../../../propTypes";
import "./index.css";

function TagLists({ items, libProps }){
	const [activeTab, setActiveTab] = useState("suggestions");
	const selectTab = useCallback((newtab, _prevtab, _event) => setActiveTab(newtab), []);
  
	return (
		<Tabs 
			animate={false}
			className={CustomClasses.TABS_MINIMAL} 
			id="tag-lists" 
			onChange={selectTab}
			renderActiveTabPanelOnly={false}
			selectedTabId={activeTab} >
			<Tab id="suggestions" title="Suggestions" 
				panel={<TagsDatalist filter="suggestions" items={items} libProps={libProps} />} 
			/>
			<Tab id="all-items" title="All tags" 
				panel={<TagsDatalist filter="all" items={items} libProps={libProps} />} 
			/>
			<Tabs.Expander />
			<LibrarySelect libProps={libProps} />
		</Tabs>
	);
}
TagLists.propTypes = {
	items: objectOf(arrayOf(customPropTypes.taglistEntry)),
	libProps: shape({
		currentLibrary: customPropTypes.zoteroLibraryType,
		onSelect: func,
		options: arrayOf(string)
	}),
	onClose: func
};

const TabContents = React.memo(function TabContents({ libraries }){
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

	return <div>
		{isLoading
			? <Spinner />
			: <TagLists items={data} libProps={libProps} /> }
	</div>;
});
TabContents.propTypes = {
	libraries: arrayOf(customPropTypes.zoteroLibraryType)
};

const TagManager = React.memo(function TagManager(){
	const { libraries } = useContext(ExtensionContext);
	const { data: writeableLibraries, isLoading } = useWriteableLibraries(libraries);

	return <SentryBoundary feature="tag-manager">
		{isLoading
			? <Spinner />
			: writeableLibraries.length == 0
				? <NoWriteableLibraries />
				: <TabContents libraries={writeableLibraries} />}
	</SentryBoundary>;
});

export default TagManager;
