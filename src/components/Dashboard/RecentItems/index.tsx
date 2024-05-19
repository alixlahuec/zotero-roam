import { ReactNode, memo, useEffect, useMemo, useState } from "react";
import { NonIdealState, Slider, SliderProps, Spinner, Switch } from "@blueprintjs/core";

import { ListWrapper, Toolbar } from "Components/DataList";
import { ErrorBoundary } from "Components/Errors";
import { useRequestsSettings } from "Components/UserSettings";
import LogItem from "./LogItem";

import { useItems } from "@clients/zotero";
import { useBool } from "@hooks";

import { makeLogFromItems } from "./utils";

import { CustomClasses } from "../../../constants";
import { categorizeLibraryItems } from "../../../utils";
import { ZDataViewContents, ZLibraryContents, ZLogItem } from "Types/transforms";
import "./_index.sass";


type LogViewSublistProps = {
	allAbstractsShown: boolean,
	items: ZLogItem[],
	label: ReactNode,
	onClose: () => void
};

const LogViewSublist = memo<LogViewSublistProps>(function LogViewSublist({ allAbstractsShown, items, label, onClose }){
	return items.length == 0
		? null
		: <>
			<h5>{label}</h5>
			{items.map(it => <LogItem key={[it.location, it.key].join("/")} allAbstractsShown={allAbstractsShown} item={it} onClose={onClose} />)}
		</>;
});


const logViewSliderStaticProps: Partial<SliderProps> = {
	labelRenderer: (num, renderingOptions = { isHandleTooltip: false }) => {
		return renderingOptions.isHandleTooltip
			? `Last ${num} days`
			: "";
	},
	min: 3,
	max: 30,
	stepSize: 1
};

type LogViewProps = {
	itemList: ZLibraryContents,
	onClose: () => void
};

const LogView = memo<LogViewProps>(function LogView({ itemList, onClose }){
	const [asRecentAs, setAsRecentAs] = useState(7);
	const [allAbstractsShown, { toggle: toggleAbstracts }] = useBool(false);
	const [itemsLog, setItemsLog] = useState<ZDataViewContents | null>(null);

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
				{itemsLog.numItems == 0
					? <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No items to display" />
					: <ListWrapper>
						<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.today} label="Today" onClose={onClose} />
						<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.yesterday} label="Yesterday" onClose={onClose} />
						<LogViewSublist allAbstractsShown={allAbstractsShown} items={itemsLog.recent} label="Recently" onClose={onClose} />
					</ListWrapper>}
				<Toolbar>
					<Slider onChange={setAsRecentAs} value={asRecentAs} {...logViewSliderStaticProps} />
					<Switch aria-checked={allAbstractsShown} checked={allAbstractsShown} label="Show all abstracts" role="switch" onChange={toggleAbstracts} />
				</Toolbar>
			</div>
	);
});


type RecentItemsProps = {
	onClose: () => void
};

const RecentItems = memo<RecentItemsProps>(function RecentItems({ onClose }){
	const [{ dataRequests }] = useRequestsSettings();
	const itemQueries = useItems(dataRequests, {
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const isLoading = itemQueries.some(q => q.isLoading);
	const data = useMemo(() => itemQueries.map(q => q.data || []).flat(1), [itemQueries]);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);
	
	return <ErrorBoundary>
		<div style={{ height: "100%" }}>
			{isLoading
				? <Spinner />
				: <LogView itemList={itemList} onClose={onClose} /> }
		</div>
	</ErrorBoundary>;
});


export default RecentItems;
