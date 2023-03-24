import { array, func, objectOf, oneOf } from "prop-types";
import { memo, useCallback, useContext, useEffect, useMemo } from "react";

import { Button, Classes, Divider, Icon, Menu, MenuItem, Spinner, Switch, Tag } from "@blueprintjs/core";
import { ContextMenu2, Tooltip2 } from "@blueprintjs/popover2";

import { ExtensionContext } from "Components/App";
import { useOtherSettings, useRequestsSettings } from "Components/UserSettings";

import { useQuery_Collections, useQuery_Items, useQuery_Permissions, useQuery_Tags } from "../../api/zotero";
import { useBool } from "../../hooks";

import { makeTimestamp } from "../../utils";

import "./index.css";


const betaTag = <Tag intent="primary" minimal={true}>Beta</Tag>;

const isCurrentlyDark = () => document.getElementsByTagName("body")[0].getAttribute("zr-dark-theme") == "true";

function DarkThemeToggle (){
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
	const { version } = useContext(ExtensionContext);
	
	return <div className="zr-icon-tooltip-footer">
		<DarkThemeToggle />
		<span className="zr-icon-tooltip-footer--row">
			<a href="https://alix-lahuec.gitbook.io/zotero-roam/" target="_blank" rel="noreferrer">Docs</a>
			<Tag className="zr-version-tag">v{version}</Tag>
		</span>
	</div>;
});

function QueriesStatusIcon(props) {
	const { queries } = props;
	const updated = queries.map(q => q.dataUpdatedAt).filter(Boolean);
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

	let iconProps = {};
	if(isSuccess){
		iconProps = {
			icon: "tick",
			intent: "success",
			color: "#00e676",
			title: "The last update was successful"
		};
	} else if(isLoadingError){
		iconProps = {
			icon: "delete",
			intent: "danger",
			title: "The extension was unable to retrieve the data"
		};
	} else if(isRefetchError){
		iconProps = {
			icon: "error",
			intent: "warning",
			title: "The last update was unsuccessful"
		};
	}

	return (
		<span zr-role="status">
			{timestamp}
			{isFetching ? <Spinner size={16} title="Loading data..." /> : <Icon size={16} {...iconProps} /> }
			<Button minimal={true} onClick={refreshData} disabled={isFetching} title="Refresh data">
				<Icon size={16} icon="refresh" />
			</Button>
		</span>
	);
}
QueriesStatusIcon.propTypes = {
	queries: array
};

function QueriesStatusList(props){
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
QueriesStatusList.propTypes = {
	queries: objectOf(array)
};

const ExtensionIcon = memo(function ExtensionIcon(props) {
	const { openDashboard, openLogger, openSearchPanel, openSettingsPanel, status, toggleExtension } = props;
	const [{ apiKeys, dataRequests, libraries }] = useRequestsSettings();
    
	const queryOpts = useMemo(() => {
		return {
			enabled: status == "on",
			notifyOnChangeProps: ["dataUpdatedAt", "status", "isFetching"]
		};
	}, [status]);

	const itemQueries = useQuery_Items(dataRequests, queryOpts);
	const permissionQueries = useQuery_Permissions(apiKeys, queryOpts);
	const tagQueries = useQuery_Tags(libraries, queryOpts);
	const collectionQueries = useQuery_Collections(libraries, queryOpts);
    
	const isCurrentlyLoading = [...permissionQueries, ...itemQueries, ...tagQueries, ...collectionQueries].some(q => q.isLoading);
	const isCurrentlyFetching = [...permissionQueries, ...itemQueries, ...tagQueries, ...collectionQueries].some(q => q.fetchStatus == "fetching");
	const hasLoadingError = [...permissionQueries, ...itemQueries, ...tagQueries, ...collectionQueries].some(q => q.isLoadingError);
	const allowContext = itemQueries.some(q => q.data);

	const data_status = useMemo(() => hasLoadingError ? "error" : ((isCurrentlyLoading && isCurrentlyFetching) ? "loading" : "ready"), [isCurrentlyFetching, isCurrentlyLoading, hasLoadingError]);
	const button_icon = useMemo(() => status == "disabled" ? "warning-sign" : hasLoadingError ? "issue" : "manual", [hasLoadingError, status]);

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
			{status == "disabled" && <Button aria-haspopup="dialog" icon="warning-sign" intent="warning" minimal={true} onClick={openSettingsPanel} text="Click to finish setting up zoteroRoam" title="Click to open zoteroRoam settings" />}
			<Divider />
			{status == "on"
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
					status={status}
					data-status={data_status}
					disabled={status == "disabled"}
					icon={button_icon}
					minimal={true} 
					small={true}
					onClick={toggleExtension}
					aria-haspopup="true"
					title={status == "disabled" ? "zoteroRoam is disabled" : "Click to toggle the zoteroRoam extension"} />
			</ContextMenu2>
		</Tooltip2>
	);
});
ExtensionIcon.propTypes = {
	openDashboard: func,
	openLogger: func,
	openSearchPanel: func,
	openSettingsPanel: func,
	status: oneOf(["on", "off", "disabled"]),
	toggleExtension: func
};

export default ExtensionIcon;