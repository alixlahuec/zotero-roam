import { memo, useCallback, useEffect, useState } from "react";
import { Classes, Icon, Tab, TabProps, Tabs } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import Explorer from "./Explorer";
import RecentItems from "./RecentItems";
import TagManager from "./TagManager";

import { CustomClasses } from "../../constants";
import "./_index.sass";


enum DashboardTab {
	EXPLORER = "explorer",
	RECENT_ITEMS = "recent-items",
	TAG_MANAGER = "tag-manager"
}

const tabStaticProps: Partial<TabProps> = {
	className: "zr-dashboard-tab",
	panelClassName: "zr-dashboard-panel"
};

type TabListProps = {
	defaultTab: DashboardTab,
	onClose: () => void
};

const TabList = memo<TabListProps>(function TabList(props){
	const { defaultTab, onClose } = props;
	const [isActiveTab, setActiveTab] = useState<DashboardTab>(defaultTab);

	useEffect(() => {
		setActiveTab(defaultTab);
	}, [defaultTab]);

	const selectTab = useCallback((newtab, _prevtab, _event) => setActiveTab(newtab), []);

	return(
		<Tabs animate={false} className={[CustomClasses.TABS, "zr-dashboard-tabs-wrapper"].join(" ")} id="zr-dashboard--tabs" onChange={selectTab} selectedTabId={isActiveTab} vertical={true} >
			<Tab id="recent-items" panel={<RecentItems onClose={onClose} />} title={<><Icon htmlTitle="Recent Items" icon="history" /><span>Recent Items</span></>} {...tabStaticProps} />
			<Tab id="tag-manager" panel={<TagManager />} title={<><Icon htmlTitle="Tag Manager" icon="tag" /><span>Tag Manager</span></>} {...tabStaticProps} />
			<Tabs.Expander />
			<Tab id="explorer" panel={<Explorer onClose={onClose} />} title={<><Icon htmlTitle="Explorer" icon="code-block" /><span>Explorer</span></>} {...tabStaticProps} />
		</Tabs>
	);
});


type DashboardProps = {
	isOpen: boolean,
	onClose: () => void
};

const Dashboard = memo<DashboardProps>(function Dashboard({ isOpen, onClose }){
	return (
		<AuxiliaryDialog
			className="dashboard"
			isOpen={isOpen}
			label="zoteroRoam Dashboard"
			onClose={onClose} >
			<div className={ Classes.DIALOG_BODY }>
				<div className="zr-dashboard--main">
					<TabList defaultTab={DashboardTab.RECENT_ITEMS} onClose={onClose} />
				</div>
			</div>
		</AuxiliaryDialog>
	);
});


export default Dashboard;
