import React, { useCallback, useContext, useMemo, useState } from "react";
import { arrayOf, bool, func, shape, string } from "prop-types";
import { Button, Slider, Spinner, Switch } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import { ListWrapper, Toolbar } from "../../DataList";
import LogItem from "./LogItem";
import { useQuery_Items } from "../../../api/queries";
import { makeLogFromItems } from "./utils";
import { categorizeLibraryItems } from "../../../utils";

import * as customPropTypes from "../../../propTypes";
import "./index.css";

function labelRenderer(num, { isHandleTooltip}) {
	return isHandleTooltip ? `Last ${num} days` : "";
}

const LogViewSublist = React.memo(function LogViewSublist({ allAbstractsShown, items, label, onClose }){
	return <>
		<h5 className="zr-auxiliary">{label}</h5>
		{items.length > 0
			? items.map(it => <LogItem key={[it.location, it.key].join("/")} allAbstractsShown={allAbstractsShown} item={it} onClose={onClose} />)
			: <span className="zr-secondary">No items</span>}
	</>;
});
LogViewSublist.propTypes = {
	allAbstractsShown: bool,
	items: arrayOf(customPropTypes.cleanRecentItemType),
	label: string,
	onClose: func
};

function LogView({ itemList, onClose }){
	const [asRecentAs, setAsRecentAs] = useState(7);
	const [allAbstractsShown, setAllAbstractsShown] = useState(false);

	const setRecency = useCallback((val) => setAsRecentAs(val), []);
	const handleToggleAbstracts = useCallback(() => setAllAbstractsShown(prevState => !prevState), []);

	const itemsLog = useMemo(() => makeLogFromItems(itemList, asRecentAs), [asRecentAs, itemList]);

	return <div className="zr-recentitems--datalist" >
		<Button icon="cross" minimal={true} onClick={onClose} />
		<ListWrapper>
			<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.today} label="Today" onClose={onClose} />
			<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.yesterday} label="Yesterday" onClose={onClose} />
			<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.recent} label="Earlier" onClose={onClose} />
		</ListWrapper>
		<Toolbar>
			<Slider labelRenderer={labelRenderer} min={3} max={30} onRelease={setRecency} stepSize={1} value={asRecentAs} />
			<Switch checked={allAbstractsShown} label="Show all abstracts" onChange={handleToggleAbstracts} />
		</Toolbar>
	</div>;
}
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
	
	return <div>
		{isLoading
			? <Spinner />
			: <LogView itemList={itemList} onClose={onClose} /> }
	</div>;
});
RecentItems.propTypes = {
	onClose: func
};

export default RecentItems;
