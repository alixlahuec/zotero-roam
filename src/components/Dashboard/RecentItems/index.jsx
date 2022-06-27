import React, { useContext, useEffect, useMemo, useState } from "react";
import { arrayOf, bool, func, shape, string } from "prop-types";
import { NonIdealState, Slider, Spinner, Switch } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import { ListWrapper, Toolbar } from "../../DataList";
import LogItem from "./LogItem";
import { useQuery_Items } from "../../../api/queries";
import { makeLogFromItems } from "./utils";
import { categorizeLibraryItems } from "../../../utils";

import SentryBoundary from "../../Errors/SentryBoundary";
import useBool from "../../../hooks/useBool";
import * as customPropTypes from "../../../propTypes";
import "./index.css";

function labelRenderer(num, { isHandleTooltip }) {
	return isHandleTooltip ? `Last ${num} days` : false;
}

const LogViewSublist = React.memo(function LogViewSublist({ allAbstractsShown, items, label, onClose }){
	return items.length == 0
		? null
		: <>
			<h5 className="zr-auxiliary">{label}</h5>
			{items.map(it => <LogItem key={[it.location, it.key].join("/")} allAbstractsShown={allAbstractsShown} item={it} onClose={onClose} />)}
		</>;
});
LogViewSublist.propTypes = {
	allAbstractsShown: bool,
	items: arrayOf(customPropTypes.cleanRecentItemType),
	label: string,
	onClose: func
};

const LogView = React.memo(function LogView({ itemList, onClose }){
	const [asRecentAs, setAsRecentAs] = useState(7);
	const [allAbstractsShown,, toggleAbstracts] = useBool(false);
	const [itemsLog, setItemsLog] = useState(null);

	useEffect(() => {
		if(itemList){
			makeLogFromItems(itemList, asRecentAs)
				.then(data => setItemsLog(data));
		}
	}, [asRecentAs, itemList]);

	return (
		itemsLog == null
			? <Spinner size={15} />
			: <div className="zr-recentitems--datalist" >
				<ListWrapper>
					{itemsLog.today.length == 0 && itemsLog.yesterday.length == 0 && itemsLog.recent.length == 0
						? <NonIdealState className="zr-auxiliary" description="No items to display" />
						: null}
					<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.today} label="Today" onClose={onClose} />
					<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.yesterday} label="Yesterday" onClose={onClose} />
					<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.recent} label="Recently" onClose={onClose} />
				</ListWrapper>
				<Toolbar>
					<Slider labelRenderer={labelRenderer} min={3} max={30} onChange={setAsRecentAs} stepSize={1} value={asRecentAs} />
					<Switch checked={allAbstractsShown} label="Show all abstracts" onChange={toggleAbstracts} />
				</Toolbar>
			</div>
	);
});
LogView.propTypes = {
	itemList: shape({
		today: arrayOf(customPropTypes.cleanRecentItemType),
		yesterday: arrayOf(customPropTypes.cleanRecentItemType),
		recent: arrayOf(customPropTypes.cleanRecentItemType)
	}),
	onClose: func
};

const RecentItems = React.memo(function RecentItems({ onClose }){
	const { dataRequests } = useContext(ExtensionContext);
	const itemQueries = useQuery_Items(dataRequests, {
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const isLoading = itemQueries.some(q => q.isLoading);
	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);
	
	return <SentryBoundary feature="recent-items">
		<div>
			{isLoading
				? <Spinner />
				: <LogView itemList={itemList} onClose={onClose} /> }
		</div>
	</SentryBoundary>;
});
RecentItems.propTypes = {
	onClose: func
};

export default RecentItems;
