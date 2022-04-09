import React, { useCallback, useContext, useMemo, useState } from "react";
import { arrayOf, func, oneOf, shape } from "prop-types";
import { Button, Spinner, Tab, Tabs } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import { ListItem, ListWrapper } from "../../DataList";
import QueryBuilder from "./QueryBuilder";

import { useQuery_Items } from "../../../api/queries";
import { categorizeLibraryItems } from "../../../utils";

import * as customPropTypes from "../../../propTypes";

function TabContents({ itemList, show }){
	const filteredData = useMemo(() => {
		switch(show){
		case "pdfs":
			return itemList.pdfs;
		case "notes":
			return itemList.notes;
		case "items":
		default:
			return itemList.items;
		}
	}, [itemList, show]);

	return show == "items" 
		? <QueryBuilder items={filteredData} />
		: <ListWrapper>{filteredData.slice(0,20).map((it, i) => <ListItem key={it.key + "-" + i}>{it.key}</ListItem>)}</ListWrapper>;
}
TabContents.propTypes = {
	itemList: shape({
		today: arrayOf(customPropTypes.cleanRecentItemType),
		yesterday: arrayOf(customPropTypes.cleanRecentItemType),
		recent: arrayOf(customPropTypes.cleanRecentItemType)
	}),
	show: oneOf(["items", "pdfs", "notes"])
};

function ExplorerTabs({ itemList, onClose }){
	const [activeTab, setActiveTab] = useState("items");
	const selectTab = useCallback((newtab, _prevtab, _event) => setActiveTab(newtab), []);
	
	return (
		<Tabs 
			animate={false}
			className="zr-tabs-minimal" 
			id="explorer-lists" 
			onChange={selectTab}
			renderActiveTabPanelOnly={false}
			selectedTabId={activeTab} >
			<Tab id="items" title="Items" 
				panel={<TabContents itemList={itemList} show="items" />} 
			/>
			<Tab id="pdfs" title="PDFs" 
				panel={<TabContents itemList={itemList} show="pdfs" />} 
			/>
			<Tab id="notes" title="Notes"
				panel={<TabContents itemList={itemList} show="notes" />}
			/>
			<Tabs.Expander />
			<Button icon="cross" minimal={true} onClick={onClose} />
		</Tabs>
	);
}
ExplorerTabs.propTypes = {
	itemList: shape({
		today: arrayOf(customPropTypes.cleanRecentItemType),
		yesterday: arrayOf(customPropTypes.cleanRecentItemType),
		recent: arrayOf(customPropTypes.cleanRecentItemType)
	}),
	onClose: func
};

function Explorer({ onClose }){
	const { dataRequests } = useContext(ExtensionContext);
	const itemQueries = useQuery_Items(dataRequests, {
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const isLoading = itemQueries.some(q => q.isLoading);
	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);

	return <div>
		{isLoading
			? <Spinner />
			: <ExplorerTabs itemList={itemList} onClose={onClose} /> }
	</div>;
}
Explorer.propTypes = {
	onClose: func
};

export default Explorer;