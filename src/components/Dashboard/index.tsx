import { ReactElement, memo, useCallback, useEffect, useState } from "react";
import { Classes, Icon, IconName, Tab, Tabs } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import Explorer from "./Explorer";
import RecentItems from "./RecentItems";
import TagManager from "./TagManager";

import { CustomClasses } from "../../constants";
import "./index.css";


enum DashboardTab {
	EXPLORER = "explorer",
	RECENT_ITEMS = "recent-items",
	TAG_MANAGER = "tag-manager"
}


type TabElementProps = {
	id: DashboardTab,
	htmlTitle: string,
	icon: IconName,
	panel: ReactElement,
	title: string
};

function TabElement({ id, htmlTitle, icon, panel, title }: TabElementProps) {
	return <Tab
		id={id}
		className="zr-dashboard-tab"
		panelClassName="zr-dashboard-panel"
		panel={panel}
		title={<>
			<Icon htmlTitle={htmlTitle} icon={icon} />
			<span>{title}</span>
		</>}
	/>;
}


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
			<TabElement id={DashboardTab.RECENT_ITEMS}
				htmlTitle="Recent Items"
				icon="history"
				panel={<RecentItems onClose={onClose} />}
				title="Recent Items" />
			<TabElement id={DashboardTab.TAG_MANAGER}
				htmlTitle="Tag Manager"
				icon="tag"
				panel={<TagManager />}
				title="Tag Manager" />
			<Tabs.Expander />
			<TabElement id={DashboardTab.EXPLORER}
				htmlTitle="Explorer"
				icon="code-block"
				panel={<Explorer onClose={onClose} />}
				title="Explorer" />
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
