import { useCallback, useMemo, useState } from "react";
import { Spinner, Tab, Tabs } from "@blueprintjs/core";

import { ErrorBoundary } from "Components/Errors";
import { useRequestsSettings } from "Components/UserSettings";
import QueryItems from "./QueryItems";
import QueryNotes from "./QueryNotes";
import QueryPDFs from "./QueryPDFs";

import { useItems } from "@clients/zotero";
import { categorizeLibraryItems } from "../../../utils";

import { CustomClasses } from "../../../constants";
import { ZLibraryContents } from "Types/transforms";
import "./_index.sass";


enum TabsEnum {
	ITEMS = "items",
	NOTES = "notes",
	PDFS = "pdfs"
}

type TabConfig = {
	show: TabsEnum,
	title: string
};

const TABS_LIST: TabConfig[] = [
	{
		show: TabsEnum.ITEMS,
		title: "Items"
	},
	{
		show: TabsEnum.PDFS,
		title: "PDFs"
	}
];


type TabContentsProps = {
	itemList: ZLibraryContents,
	onClose: () => void,
	show: TabsEnum
};

function TabContents({ itemList, onClose, show }: TabContentsProps){
	return show == TabsEnum.ITEMS
		? <QueryItems itemList={itemList} onClose={onClose} />
		: show == TabsEnum.PDFS
			? <QueryPDFs itemList={itemList} />
			: <QueryNotes itemList={itemList} />;
}


type ExplorerTabsProps = {
	itemList: ZLibraryContents,
	onClose: () => void
};

function ExplorerTabs({ itemList, onClose }: ExplorerTabsProps){
	const [activeTab, setActiveTab] = useState(TabsEnum.ITEMS);
	const selectTab = useCallback((newtab, _prevtab, _event) => setActiveTab(newtab), []);
	
	return (
		<Tabs 
			animate={false}
			className={CustomClasses.TABS_MINIMAL} 
			id="explorer-lists" 
			onChange={selectTab}
			renderActiveTabPanelOnly={false}
			selectedTabId={activeTab} >
			{TABS_LIST.map((config) => (
				<Tab key={config.show} id={config.show}
					panel={<TabContents itemList={itemList} onClose={onClose} show={config.show} />}
					title={config.title} />
			))}
		</Tabs>
	);
}


type ExplorerProps = {
	onClose: () => void
};

function Explorer({ onClose }: ExplorerProps){
	const [{ dataRequests }] = useRequestsSettings();
	const itemQueries = useItems(dataRequests, {
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const isLoading = itemQueries.some(q => q.isLoading);
	const data = useMemo(() => itemQueries.map(q => q.data || []).flat(1), [itemQueries]);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);

	return <ErrorBoundary>
		<div>
			{isLoading
				? <Spinner />
				: <ExplorerTabs itemList={itemList} onClose={onClose} /> }
		</div>
	</ErrorBoundary>;
}


export default Explorer;