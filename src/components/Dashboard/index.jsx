import React, { useCallback, useEffect, useState } from "react";
import { bool, func, oneOf } from "prop-types";
import { Classes, Icon, Tab, Tabs } from "@blueprintjs/core";

import AuxiliaryDialog from "../AuxiliaryDialog";
import RecentItems from "./RecentItems";
import TagManager from "./TagManager";

import "./index.css";

const TabList = React.memo(function TabList(props){
	const { defaultTab, onClose } = props;
	const [isActiveTab, setActiveTab] = useState(defaultTab);

	useEffect(() => {
		setActiveTab(defaultTab);
	}, [defaultTab]);

	const selectTab = useCallback((newtab, _prevtab, _event) => setActiveTab(newtab), []);

	return(
		<Tabs animate={false} className="zr-tabs" id="zr-dashboard--tabs" onChange={selectTab} selectedTabId={isActiveTab} vertical={true} >
			<Tab className="zr-tagmanager" id="tag-manager" panel={<TagManager onClose={onClose} />} title={<><Icon htmlTitle="Tag Manager" icon="tag" /><span>Tag Manager</span></>} />
			<Tab className="zr-recentitems" id="recent-items" panel={<RecentItems onClose={onClose} />} title={<><Icon htmlTitle="Recent Items" icon="history" /><span>Recent Items</span></>} />
		</Tabs>
	);
});
TabList.propTypes = {
	defaultTab: oneOf(["tag-manager"]),
	onClose: func
};

const Dashboard = React.memo(function Dashboard(props){
	const { isOpen, onClose } = props;

	return (
		<AuxiliaryDialog
			className="dashboard"
			isOpen={isOpen}
			onClose={onClose} >
			<div className={ Classes.DIALOG_BODY }>
				<div className="zr-dashboard--main">
					<TabList defaultTab="tag-manager" onClose={onClose} />
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
