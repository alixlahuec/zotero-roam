import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, number, object } from "prop-types";
import { Button, Slider, Spinner } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import { ListItem, ListWrapper, Toolbar } from "../../DataList";

import { useQuery_Items } from "../../../api/queries";
import { getCitekeyPagesWithEditTime } from "../../../roam";

function makeLogFromItems(items, recently = 7){
	let libItems = [...items];
	let citPages = getCitekeyPagesWithEditTime();

	// Set up date thresholds
	let today = new Date();
	today.setHours(0,0,0);
	let yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);
	yesterday.setHours(0,0,0);
	let recent = new Date();
	recent.setDate(today.getDate() - recently);
	recent.setHours(0,0,0);
    
	let dateView = libItems.reduce((log, item) => {
		// Obtain data for the item's Roam page (if it exists)
		let rPage = citPages.find(p => p.title == "@" + item.key) || {};
		let { edited, title = "@" + item.key, uid = null } = rPage;
		let zotero_last_edit = new Date(item.data.dateModified);

		let last_combined_edit = new Date(Math.max(...[edited, zotero_last_edit].filter(Boolean)));

		// Merge their data, then push it to the log
		let entry = {
			edited: last_combined_edit,
			raw: item,
			title,
			uid
		};

		if(last_combined_edit > today) {
			log.today.push(entry);
		} else if(last_combined_edit > yesterday){
			log.yesterday.push(entry);
		} else if(last_combined_edit > recent){
			log.recent.push(entry);
		} else {
			log.old.push(entry);
		}

		return log;

	}, {
		today: [],
		yesterday: [],
		recent: [],
		old: []
	});

	Object.values(dateView).forEach(arr => arr.sort((a,b) => (a.edited < b.edited ? 1 : -1)));

	return dateView;

}

function LogView({ itemList, onClose, recency, setRecency }){

	return <>
		<Button icon="cross" minimal={true} onClick={onClose} />
		<Toolbar>
			<Slider min={3} max={30} onRelease={setRecency} stepSize={1} value={recency} />
		</Toolbar>
		<ListWrapper>
			<h5>Today</h5>
			{itemList.today.length > 0
				? itemList.today.map(it => <ListItem key={it.raw.library.id + it.raw.key}>{it.raw.key}</ListItem>)
				: <span className="zr-secondary">No items</span>}
			<h5>Yesterday</h5>
			{itemList.yesterday.length > 0
				? itemList.yesterday.map(it => <ListItem key={it.raw.library.id + it.raw.key}>{it.raw.key}</ListItem>)
				: <span className="zr-secondary">No items</span>}
			<h5>Earlier</h5>
			{itemList.recent.length > 0
				? itemList.recent.map(it => <ListItem key={it.raw.library.id + it.raw.key}>{it.raw.key}</ListItem>)
				: <span className="zr-secondary">No items</span>}
		</ListWrapper>
	</>;
}
LogView.propTypes = {
	itemList: object,
	onClose: func,
	recency: number,
	setRecency: func
};

const RecentItems = React.memo(function RecentItems({ onClose }){
	const { dataRequests } = useContext(ExtensionContext);
	const [asRecentAs, setAsRecentAs] = useState(7);
	const itemQueries = useQuery_Items(dataRequests, {
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const isLoading = itemQueries.some(q => q.isLoading);
	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => makeLogFromItems(data, asRecentAs), [asRecentAs, data]);

	const setRecency = useCallback((val) => setAsRecentAs(val), []);
	
	return <div>
		{isLoading
			? <Spinner />
			: <LogView itemList={itemList} onClose={onClose} recency={asRecentAs} setRecency={setRecency} /> }
	</div>;
});
RecentItems.propTypes = {
	onClose: func
};

export default RecentItems;
