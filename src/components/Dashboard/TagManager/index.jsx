import { arrayOf, func, objectOf, shape, string } from "prop-types";
import { useCallback, useMemo, useState } from "react";

import { Spinner, Tab, Tabs } from "@blueprintjs/core";

import ErrorBoundary from "Components/Errors/ErrorBoundary";
import LibrarySelect from "../LibrarySelect";
import NoWriteableLibraries from "Components/Errors/NoWriteableLibraries";
import TagsDatalist from "./TagsDatalist";

import { useQuery_Tags, useWriteableLibraries } from "../../../api/queries";
import { useRequestsSettings } from "Components/UserSettings/Requests";

import * as customPropTypes from "../../../propTypes";
import { CustomClasses } from "../../../constants";

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

function TabContents({ libraries }){
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
			? <Spinner title="Loading tags..." />
			: <TagLists items={data} libProps={libProps} /> }
	</div>;
}
TabContents.propTypes = {
	libraries: arrayOf(customPropTypes.zoteroLibraryType)
};

function TagManager(){
	const [{ libraries }] = useRequestsSettings();
	const { data: writeableLibraries, isLoading } = useWriteableLibraries(libraries);

	return <ErrorBoundary>
		{isLoading
			? <Spinner title="Loading libraries..." />
			: writeableLibraries.length == 0
				? <NoWriteableLibraries />
				: <TabContents libraries={writeableLibraries} />}
	</ErrorBoundary>;
}

export default TagManager;
