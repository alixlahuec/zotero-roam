import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { arrayOf, func, oneOf, shape } from "prop-types";
import { Button, NonIdealState, Spinner, Tab, Tabs } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import { ListItem, ListWrapper, Pagination, Toolbar } from "../../DataList";

import { useQuery_Items } from "../../../api/queries";
import { categorizeLibraryItems } from "../../../utils";

import * as customPropTypes from "../../../propTypes";

const itemsPerPage = 30;

function TabContents({ itemList, show }){
	const [currentPage, setCurrentPage] = useState(1);
	
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

	// * Placeholder for development
	const queriedData = useMemo(() => filteredData.slice(0, 20), [filteredData]);

	const pageLimits = useMemo(() => [itemsPerPage*(currentPage - 1), itemsPerPage*currentPage], [currentPage]);

	useEffect(() => {
		setCurrentPage(1);
	}, [filteredData, queriedData]);

	return <div>
		<Toolbar>
			<Pagination 
				currentPage={currentPage} 
				itemsPerPage={itemsPerPage} 
				nbItems={filteredData.length} 
				setCurrentPage={setCurrentPage} 
			/>
		</Toolbar>
		<ListWrapper>
			{filteredData.length > 0
				? filteredData
					.slice(...pageLimits)
					.map((el, i) => <ListItem key={[el.key, i].join("-")}>{el.key}</ListItem>)
				: <NonIdealState className="zr-auxiliary" description="No items to display" />}
		</ListWrapper>
	</div>;
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