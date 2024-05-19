import { memo, useEffect, useMemo, useState } from "react";
import { Classes, NonIdealState, Spinner, Switch } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import { ListWrapper, Pagination, Toolbar } from "Components/DataList";
import LogEntry from "./LogEntry";

import { ZoteroRoamLog } from "../../api/logging";
import { useBool, usePagination } from "@hooks";

import { CustomClasses } from "../../constants";
import "./_index.sass";


const itemsPerPage = 20;

function LoggerList({ items }: { items: ZoteroRoamLog[]}){
	const [showAllEntries, { toggle: toggleShowAll }] = useBool(false);
	const { currentPage, pageLimits, setCurrentPage } = usePagination({ itemsPerPage });

	const visibleItems = useMemo(() => {
		return showAllEntries
			? items
			: items.filter(it => it.level == "error");
	}, [items, showAllEntries]);

	useEffect(() => {
		setCurrentPage(1);
	}, [items, visibleItems, setCurrentPage]);

	return <div className="zr-logger--datalist">
		{visibleItems.length == 0
			? <NonIdealState className={CustomClasses.TEXT_AUXILIARY} description="No items to display" />
			: <ListWrapper>
				{visibleItems
					.sort((a, b) => a.timestamp > b.timestamp ? -1 : 1)
					.slice(...pageLimits)
					.map((entry, j) => <LogEntry key={j} log={entry} />)}
			</ListWrapper>}
		<Toolbar>
			<Pagination
				arrows="first"
				currentPage={currentPage}
				itemsPerPage={itemsPerPage}
				nbItems={visibleItems.length}
				setCurrentPage={setCurrentPage}
			/>
			<Switch aria-checked={showAllEntries} checked={showAllEntries} label="Show all entries" role="switch" onChange={toggleShowAll} />
		</Toolbar>
	</div>;
}


type LoggerProps = {
	isOpen: boolean,
	onClose: () => void
};

const Logger = memo(function Logger({ isOpen, onClose }: LoggerProps){
	const [logData, setLogData] = useState<ZoteroRoamLog[] | null>(null);

	useEffect(() => {
		try {
			const items = window.zoteroRoam.logs;
			setLogData(items);
		} catch(e) {
			console.error(e);
			setLogData([]);
		}
	}, []);

	return (
		<AuxiliaryDialog
			className="logger"
			isOpen={isOpen}
			label="zoteroRoam Logs"
			onClose={onClose} >
			<div className={ Classes.DIALOG_BODY }>
				{logData == null
					? <Spinner size={15} />
					: <LoggerList items={logData} />}
			</div>
		</AuxiliaryDialog>
	);
});

export default Logger;
