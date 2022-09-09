import { bool, func, oneOf } from "prop-types";
import { memo, useCallback, useEffect, useState } from "react";

import { Classes, Icon, Tab, Tabs } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import Explorer from "./Explorer";
import RecentItems from "./RecentItems";
import TagManager from "./TagManager";

import { CustomClasses } from "../../constants";

import "./index.css";


const TabList = memo(function TabList(props){
	const { defaultTab, onClose } = props;
	const [isActiveTab, setActiveTab] = useState(defaultTab);

	useEffect(() => {
		setActiveTab(defaultTab);
	}, [defaultTab]);

	const selectTab = useCallback((newtab, _prevtab, _event) => setActiveTab(newtab), []);

	return(
		<Tabs animate={false} className={CustomClasses.TABS} id="zr-dashboard--tabs" onChange={selectTab} selectedTabId={isActiveTab} vertical={true} >
			<Tab className="zr-recentitems" id="recent-items" panel={<RecentItems onClose={onClose} />} title={<><Icon htmlTitle="Recent Items" icon="history" /><span>Recent Items</span></>} />
			<Tab className="zr-tagmanager" id="tag-manager" panel={<TagManager />} title={<><Icon htmlTitle="Tag Manager" icon="tag" /><span>Tag Manager</span></>} />
			<Tabs.Expander />
			<Tab className="zr-explorer" id="explorer" panel={<Explorer onClose={onClose} />} title={<><Icon htmlTitle="Explorer" icon="code-block" /><span>Explorer</span></>} />
		</Tabs>
	);
});
TabList.propTypes = {
	defaultTab: oneOf(["tag-manager", "recent-items", "explorer"]),
	onClose: func
};

const Dashboard = memo(function Dashboard({ isOpen, onClose }){
	return (
		<AuxiliaryDialog
			className="dashboard"
			isOpen={isOpen}
			label="zoteroRoam Dashboard"
			onClose={onClose} >
			<div className={ Classes.DIALOG_BODY }>
				<div className="zr-dashboard--main">
					<TabList defaultTab="recent-items" onClose={onClose} />
				</div>
			</div>
		</AuxiliaryDialog>
	);
});
Dashboard.propTypes = {
	isOpen: bool,
	onClose: func
};

export default Dashboard;
