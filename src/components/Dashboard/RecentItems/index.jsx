import { arrayOf, bool, func, number, shape, string } from "prop-types";
import { memo, useEffect, useMemo, useState } from "react";

import { NonIdealState, Slider, Spinner, Switch } from "@blueprintjs/core";

import ErrorBoundary from "Components/Errors/ErrorBoundary";
import { ListWrapper, Toolbar } from "Components/DataList";
import LogItem from "./LogItem";

import useBool from "../../../hooks/useBool";
import { useQuery_Items } from "../../../api/items";
import { useRequestsSettings } from "Components/UserSettings/Requests";

import { categorizeLibraryItems } from "../../../utils";
import { makeLogFromItems } from "./utils";

import * as customPropTypes from "../../../propTypes";
import { CustomClasses } from "../../../constants";

import "./index.css";


const sliderHandleProps = {
	"aria-label": "Select how many days to include in the list"
};

function labelRenderer(num, { isHandleTooltip }) {
	return isHandleTooltip ? `Last ${num} days` : false;
}

const LogViewSublist = memo(function LogViewSublist({ allAbstractsShown, items, label, onClose }){
	return items.length == 0
		? null
		: <>
			<h5>{label}</h5>
			{items.map(it => <LogItem key={[it.location, it.key].join("/")} allAbstractsShown={allAbstractsShown} item={it} onClose={onClose} />)}
		</>;
});
LogViewSublist.propTypes = {
	allAbstractsShown: bool,
	items: arrayOf(customPropTypes.cleanRecentItemType),
	label: string,
	onClose: func
};

const LogView = memo(function LogView({ itemList, onClose }){
	const [asRecentAs, setAsRecentAs] = useState(7);
	const [allAbstractsShown, { toggle: toggleAbstracts }] = useBool(false);
	const [itemsLog, setItemsLog] = useState(null);

	useEffect(() => {
		if(itemList){
			makeLogFromItems(itemList, asRecentAs)
				.then(data => setItemsLog(data));
		}
	}, [asRecentAs, itemList]);

	return (
		itemsLog == null
			? <Spinner size={15} title="Loading recent items..." />
			: <div className="zr-recentitems--datalist" >
				{itemsLog.numItems == 0
					? <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No items to display" />
					: <ListWrapper>
						<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.today} label="Today" onClose={onClose} />
						<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.yesterday} label="Yesterday" onClose={onClose} />
						<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.recent} label="Recently" onClose={onClose} />
					</ListWrapper>}
				<Toolbar>
					<Slider handleHtmlProps={sliderHandleProps} labelRenderer={labelRenderer} min={3} max={30} onChange={setAsRecentAs} stepSize={1} value={asRecentAs} />
					<Switch aria-checked={allAbstractsShown} checked={allAbstractsShown} label="Show all abstracts" role="switch" onChange={toggleAbstracts} />
				</Toolbar>
			</div>
	);
});
LogView.propTypes = {
	itemList: shape({
		today: arrayOf(customPropTypes.cleanRecentItemType),
		yesterday: arrayOf(customPropTypes.cleanRecentItemType),
		recent: arrayOf(customPropTypes.cleanRecentItemType),
		numItems: number
	}),
	onClose: func
};

const RecentItems = memo(function RecentItems({ onClose }){
	const [{ dataRequests }] = useRequestsSettings();
	const itemQueries = useQuery_Items(dataRequests, {
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const isLoading = itemQueries.some(q => q.isLoading);
	const data = useMemo(() => itemQueries.map(q => q.data || []).flat(1), [itemQueries]);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);
	
	return <ErrorBoundary>
		<div style={{ height: "100%" }}>
			{isLoading
				? <Spinner title="Loading library items..." />
				: <LogView itemList={itemList} onClose={onClose} /> }
		</div>
	</ErrorBoundary>;
});
RecentItems.propTypes = {
	onClose: func
};

export default RecentItems;
