import React, { useCallback, useContext, useMemo } from "react";
import { array, func, objectOf, oneOf } from "prop-types";
import { Button, Classes, Divider, Icon, Menu, MenuItem, Spinner, Tag } from "@blueprintjs/core";
import { ContextMenu2, Tooltip2 } from "@blueprintjs/popover2";

import { useQuery_Collections, useQuery_Items, useQuery_Permissions, useQuery_Tags } from "../../api/queries";
import { makeTimestamp } from "../../utils";

import { ExtensionContext } from "../App";
import "./index.css";

const IconTooltipFooter = React.memo(function IconTooltipFooter() {
	const { version } = useContext(ExtensionContext);

	return <>
		<a href="https://alix-lahuec.gitbook.io/zotero-roam/" target="_blank" rel="noreferrer">Extension documentation</a>
		<Divider />
		<span className="zr-icon-tooltip-footer">
			<a href="https://alix-lahuec.gitbook.io/zotero-roam/changelog" target="_blank" rel="noreferrer">Changelog</a>
			<Tag className="zr-version-tag">v{version}</Tag>
		</span>
	</>;
});

function QueriesStatusIcon(props) {
	let { queries } = props;
	let updated = queries.map(q => q.dataUpdatedAt).filter(Boolean);
	let timestamp = updated.length > 0 ? <span zr-role="timestamp">{makeTimestamp(Math.max(...updated))}</span> : null;

	let isFetching = queries.some(q => q.isFetching);
	let isSuccess = queries.every(q => q.isSuccess);
	let isLoadingError = queries.some(q => q.isLoadingError);
	let isRefetchError = queries.some(q => q.isRefetchError);

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
			{isFetching ? <Spinner size={16} /> : <Icon size={16} {...iconProps} /> }
			<Button minimal={true} onClick={refreshData} disabled={isFetching}>
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

const ExtensionIcon = React.memo(function ExtensionIcon(props) {
	const { openDashboard, openSearchPanel, status, toggleExtension } = props;
	const { apiKeys, dataRequests, libraries } = useContext(ExtensionContext);
    
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
	const hasLoadingError = [...permissionQueries, ...itemQueries, ...tagQueries, ...collectionQueries].some(q => q.isLoadingError);
	const allowContext = itemQueries.some(q => q.data);

	const data_status = useMemo(() => hasLoadingError ? "error" : (isCurrentlyLoading ? "loading" : "ready"), [isCurrentlyLoading, hasLoadingError]);
	const button_icon = useMemo(() => hasLoadingError ? "issue" : "manual", [hasLoadingError]);

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
	}, [queries, status]);

	const contextMenu = useMemo(() => {
		return (
			<Menu>
				<MenuItem text="Dashboard" icon="dashboard" onClick={openDashboard} />
				<MenuItem text="Search in library" icon="search" onClick={openSearchPanel} />
			</Menu>
		);
	}, [openDashboard, openSearchPanel]);

	return (
		<Tooltip2 popoverClassName="zr-icon-tooltip" 
			usePortal={false} 
			content={tooltipContent}
			placement='auto'
			interactionKind='hover' 
			hoverOpenDelay={450} 
			hoverCloseDelay={450} 
		>
			<ContextMenu2
				disabled={!allowContext}
				content={contextMenu}
			>
				<Button id="zotero-roam-icon"
					status={status}
					data-status={data_status}
					disabled={false}
					icon={button_icon}
					minimal={true} 
					small={true}
					onClick={toggleExtension} />
			</ContextMenu2>
		</Tooltip2>
	);
});
ExtensionIcon.propTypes = {
	openDashboard: func,
	openSearchPanel: func,
	status: oneOf(["on", "off"]),
	toggleExtension: func
};

export default ExtensionIcon;