import { useCallback, useMemo, useState } from "react";
import { Spinner, Tab, Tabs } from "@blueprintjs/core";

import { ErrorBoundary, NoWriteableLibraries } from "Components/Errors";
import { useRequestsSettings } from "Components/UserSettings";
import LibrarySelect, { LibrarySelectProps } from "../LibrarySelect";
import TagsDatalist from "./TagsDatalist";

import { useQuery_Tags, useWriteableLibraries } from "../../../api/queries";

import { CustomClasses } from "../../../constants";
import { ZLibrary, ZTagList } from "Types/transforms";
import "./index.css";


type TagListsProps = {
	items: ZTagList | undefined
} & Pick<LibrarySelectProps, "libProps">;

function TagLists({ items, libProps }: TagListsProps){
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
				panel={<TagsDatalist filter="suggestions" items={items} library={libProps.currentLibrary} />} 
			/>
			<Tab id="all-items" title="All tags" 
				panel={<TagsDatalist filter="all" items={items} library={libProps.currentLibrary} />} 
			/>
			<Tabs.Expander />
			<LibrarySelect libProps={libProps} />
		</Tabs>
	);
}


type TabContentsProps = {
	libraries: ZLibrary[]
};

function TabContents({ libraries }: TabContentsProps){
	const [selectedLibrary, setSelectedLibrary] = useState(libraries[0]);

	const { isLoading, data } = useQuery_Tags([selectedLibrary], { 
		notifyOnChangeProps: ["data"], 
		select: (datastore) => datastore.data
	})[0];
	
	const libOptions = useMemo(() => libraries.map(lib => lib.path), [libraries]);
	const handleLibrarySelect = useCallback((path) => setSelectedLibrary(libraries.find(lib => lib.path == path)!), [libraries]);
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
}


function TagManager(){
	const [{ libraries }] = useRequestsSettings();
	const { data: writeableLibraries, isLoading } = useWriteableLibraries(libraries);

	return <ErrorBoundary>
		{isLoading
			? <Spinner />
			: writeableLibraries.length == 0
				? <NoWriteableLibraries />
				: <TabContents libraries={writeableLibraries} />}
	</ErrorBoundary>;
}

export default TagManager;
