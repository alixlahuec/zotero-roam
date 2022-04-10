import React, { useCallback, useContext, useMemo, useState } from "react";
import { arrayOf, func, oneOf, shape } from "prop-types";
import { Button, Spinner, Tab, Tabs } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import { ListItem, ListWrapper } from "../../DataList";
import QueryBuilder from "./QueryBuilder";
import { useRoamCitekeys } from "../../RoamCitekeysContext";

import { useQuery_Items } from "../../../api/queries";
import { categorizeLibraryItems, cleanLibraryItem, identifyChildren } from "../../../utils";

import * as customPropTypes from "../../../propTypes";
import "./index.css";

function TabContents({ itemList, onClose, show }){
	const [roamCitekeys,] = useRoamCitekeys();
	const filteredData = useMemo(() => {
		switch(show){
		case "pdfs":
			return itemList.pdfs;
		case "notes":
			return itemList.notes;
		case "items":
		default:
			return itemList.items
				.map(item => {
					let itemKey = item.data.key;
					let location = item.library.type + "s/" + item.library.id;
					let { pdfs, notes } = identifyChildren(itemKey, location, { pdfs: itemList.pdfs, notes: itemList.notes });

					return cleanLibraryItem(item, pdfs, notes, roamCitekeys);
				});
		}
	}, [itemList, roamCitekeys, show]);

	return show == "items" 
		? <QueryBuilder items={filteredData} onClose={onClose} />
		: <ListWrapper>{filteredData.slice(0,20).map((it, i) => <ListItem key={it.key + "-" + i}>{it.key}</ListItem>)}</ListWrapper>;
}
TabContents.propTypes = {
	itemList: shape({
		items: arrayOf(customPropTypes.zoteroItemType),
		pdfs: arrayOf(customPropTypes.zoteroItemType),
		notes: arrayOf(customPropTypes.zoteroItemType)
	}),
	onClose: func,
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
				panel={<TabContents itemList={itemList} onClose={onClose} show="items" />} 
			/>
			<Tab id="pdfs" title="PDFs" 
				panel={<TabContents itemList={itemList} onClose={onClose} show="pdfs" />} 
			/>
			<Tab id="notes" title="Notes"
				panel={<TabContents itemList={itemList} onClose={onClose} show="notes" />}
			/>
			<Tabs.Expander />
			<Button icon="cross" minimal={true} onClick={onClose} />
		</Tabs>
	);
}
ExplorerTabs.propTypes = {
	itemList: shape({
		items: arrayOf(customPropTypes.zoteroItemType),
		pdfs: arrayOf(customPropTypes.zoteroItemType),
		notes: arrayOf(customPropTypes.zoteroItemType)
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