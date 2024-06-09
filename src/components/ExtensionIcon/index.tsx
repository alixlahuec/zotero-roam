import { memo, useCallback, useEffect, useMemo } from "react";
import { Button, Classes, Divider, Icon, IconName, IconProps, Intent, Menu, MenuItem, Spinner, Switch, Tag } from "@blueprintjs/core";
import { ContextMenu2, Tooltip2 } from "@blueprintjs/popover2";
import { QueryObserverOptions, UseQueryResult } from "@tanstack/react-query";

import { useExtensionContext } from "Components/App";
import { useOtherSettings, useRequestsSettings } from "Components/UserSettings";

import { useCollections, useItems, usePermissions, useTags } from "@clients/zotero";
import { useBool } from "@hooks";
import { Queries } from "@services/react-query";

import { makeTimestamp } from "../../utils";

import { ExtensionStatusEnum } from "Types/extension";
import { AsBoolean } from "Types/helpers";
import "./_index.sass";


type QueriesList = {
	"Permissions": UseQueryResult<Queries.Data.Permissions>[],
	"Collections": UseQueryResult<Queries.Data.Collections>[],
	"Tags": UseQueryResult<Queries.Data.Tags>[],
	"Items": UseQueryResult<Queries.Data.Items>[]
};


const betaTag = <Tag intent="primary" minimal={true}>Beta</Tag>;
const newTag = <Tag intent="success" minimal={true}>NEW</Tag>;

const isCurrentlyDark = () => document.getElementsByTagName("body")[0].getAttribute("zr-dark-theme") == "true";

function DarkThemeToggle() {
	const [{ darkTheme }] = useOtherSettings();
	const [useDark, { set: setUseDark, toggle: toggleDark }] = useBool(darkTheme);
	
	const toggleDarkTheme = useCallback(() => {
		const is_currently_dark = isCurrentlyDark();
		document.getElementsByTagName("body")[0].setAttribute("zr-dark-theme", (!is_currently_dark).toString());
		toggleDark();
	}, [toggleDark]);

	useEffect(() => {
		setUseDark(isCurrentlyDark());
	}, [setUseDark]);

	return <Switch 
		alignIndicator="right" 
		checked={useDark} 
		inline={false} 
		label="Dark Theme"
		onChange={toggleDarkTheme} />;
}

const IconTooltipFooter = memo(function IconTooltipFooter() {
	const { version } = useExtensionContext();
	
	return <div className="zr-icon-tooltip-footer">
		<DarkThemeToggle />
		<span className="zr-icon-tooltip-footer--row">
			<a href="https://alix-lahuec.gitbook.io/zotero-roam/" target="_blank" rel="noreferrer">Docs</a>
			<Tag className="zr-version-tag">v{version}</Tag>
		</span>
	</div>;
});


type QueriesStatusIconProps = {
	queries: UseQueryResult[]
};

function QueriesStatusIcon(props: QueriesStatusIconProps) {
	const { queries } = props;
	const updated = queries.map(q => q.dataUpdatedAt).filter(AsBoolean);
	const timestamp = updated.length > 0 ? <span zr-role="timestamp">{makeTimestamp(Math.max(...updated))}</span> : null;

	const isFetching = queries.some(q => q.isFetching);
	const isSuccess = queries.every(q => q.isSuccess);
	const isLoadingError = queries.some(q => q.isLoadingError);
	const isRefetchError = queries.some(q => q.isRefetchError);

	const refreshData = useCallback(() => {
		queries.forEach(q => {
			q.refetch();
		});
	}, [queries]);

	let icon: IconName = "blank";
	let iconProps: Partial<IconProps> = {};
	if (isSuccess) {
		icon = "tick";
		iconProps = {
			intent: Intent.SUCCESS,
			color: "#00e676",
			title: "The last update was successful"
		};
	} else if (isLoadingError) {
		icon = "delete";
		iconProps = {
			intent: Intent.DANGER,
			title: "The extension was unable to retrieve the data"
		};
	} else if (isRefetchError) {
		icon = "error";
		iconProps = {
			intent: Intent.WARNING,
			title: "The last update was unsuccessful"
		};
	}

	return (
		<span zr-role="status">
			{timestamp}
			{isFetching ? <Spinner size={16} /> : <Icon size={16} icon={icon} {...iconProps} /> }
			<Button minimal={true} onClick={refreshData} disabled={isFetching} title="Refresh data">
				<Icon size={16} icon="refresh" />
			</Button>
		</span>
	);
}


type QueriesStatusListProps = {
	queries: QueriesList
};

function QueriesStatusList(props: QueriesStatusListProps){
	const { queries } = props;
	return (
		<ul className={Classes.LIST_UNSTYLED}>
			{Object.keys(queries).map((key) => {
				return (
					<li className="zr-queries-status" key={key}>
						<span zr-role="entry">{key}</span>
						<QueriesStatusIcon queries={queries[key]} />
					</li>
				);
			})}
		</ul>
	);
}


type ExtensionIconProps = {
	openDashboard: () => void,
	openLogger: () => void,
	openSearchPanel: () => void,
	openSettingsPanel: () => void,
	status: ExtensionStatusEnum,
	toggleExtension: () => void
};

const ExtensionIcon = memo<ExtensionIconProps>(function ExtensionIcon(props) {
	const { openDashboard, openLogger, openSearchPanel, openSettingsPanel, status, toggleExtension } = props;
	const [{ apiKeys, dataRequests, libraries }] = useRequestsSettings();
    
	const queryOpts = useMemo<Pick<QueryObserverOptions, "enabled" | "notifyOnChangeProps">>(() => ({
		enabled: status == ExtensionStatusEnum.ON,
		notifyOnChangeProps: ["dataUpdatedAt", "status", "isFetching"]
	}), [status]);

	const itemQueries = useItems(dataRequests, queryOpts);
	const permissionQueries = usePermissions(apiKeys, queryOpts);
	const tagQueries = useTags(libraries, queryOpts);
	const collectionQueries = useCollections(libraries, queryOpts);
    
	const isCurrentlyLoading = [...permissionQueries, ...itemQueries, ...tagQueries, ...collectionQueries].some(q => q.isLoading);
	const isCurrentlyFetching = [...permissionQueries, ...itemQueries, ...tagQueries, ...collectionQueries].some(q => q.fetchStatus == "fetching");
	const hasLoadingError = [...permissionQueries, ...itemQueries, ...tagQueries, ...collectionQueries].some(q => q.isLoadingError);
	const allowContext = itemQueries.some(q => q.data);

	const data_status = useMemo(() => hasLoadingError ? "error" : ((isCurrentlyLoading && isCurrentlyFetching) ? "loading" : "ready"), [isCurrentlyFetching, isCurrentlyLoading, hasLoadingError]);
	const button_icon = useMemo(() => status == ExtensionStatusEnum.DISABLED ? "warning-sign" : hasLoadingError ? "issue" : "manual", [hasLoadingError, status]);

	const queries = useMemo(() => {
		return {
			"Permissions": permissionQueries,
			"Collections": collectionQueries,
			"Tags": tagQueries,
			"Items": itemQueries
		};
	}, [collectionQueries, itemQueries, permissionQueries, tagQueries]);

	const tooltipContent = useMemo(() => {
		return <>
			<span><strong>Status : </strong> {status}</span>
			{status == ExtensionStatusEnum.DISABLED && <Button aria-haspopup="dialog" icon="warning-sign" intent="warning" minimal={true} onClick={openSettingsPanel} text="Click to finish setting up zoteroRoam" title="Click to open zoteroRoam settings" />}
			<Divider />
			{status == ExtensionStatusEnum.ON
				? <>
					<span className="zr-icon-tooltip-body">
						<QueriesStatusList queries={queries} />
					</span>
					<Divider />
				</>
				: null}
			<IconTooltipFooter />
		</>;
	}, [openSettingsPanel, queries, status]);

	const contextMenu = useMemo(() => {
		return (
			<Menu>
				<MenuItem text="Settings" icon="settings" onClick={openSettingsPanel} />
				<MenuItem disabled={!allowContext} text="Dashboard" icon="dashboard" labelElement={betaTag} onClick={openDashboard} />
				<MenuItem disabled={!allowContext} text="Search in library" icon="search" onClick={openSearchPanel} />
				<MenuItem text="View logs" icon="console" onClick={openLogger} />
				<MenuItem text="Roadmap" icon="map-create" href="https://alix.canny.io/zoteroroam" target="_blank" labelElement={newTag} />
			</Menu>
		);
	}, [allowContext, openDashboard, openLogger, openSearchPanel, openSettingsPanel]);

	return (
		<Tooltip2 popoverClassName="zr-icon-tooltip" 
			usePortal={false} 
			content={tooltipContent}
			placement="auto"
			interactionKind="hover" 
			hoverOpenDelay={450} 
			hoverCloseDelay={450} 
		>
			<ContextMenu2
				content={contextMenu}
			>
				<Button id="zotero-roam-icon"
					data-extension-status={status}
					data-fetching-status={data_status}
					disabled={status == ExtensionStatusEnum.DISABLED}
					icon={button_icon}
					minimal={true} 
					small={true}
					onClick={toggleExtension}
					aria-haspopup="true"
					title={status == ExtensionStatusEnum.DISABLED ? "zoteroRoam is disabled" : "Click to toggle the zoteroRoam extension"} />
			</ContextMenu2>
		</Tooltip2>
	);
});

export default ExtensionIcon;