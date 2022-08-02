import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

import { Button, Classes, Dialog, Tag } from "@blueprintjs/core";

import { RowCol } from "../common";
import useBool from "../../../hooks/useBool";

import { CustomClasses } from "../../../constants";

import * as customPropTypes from "../../../propTypes";


const RequestsSettings = React.createContext({});

const RequestsProvider = ({ children, init, updater }) => {
	const [requests, _setRequests] = useState(init);

	const setRequests = useCallback((updateFn) => {
		_setRequests((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			window?.zoteroRoam?.updateLibraries?.(update.libraries);
			return update;
		});
	}, [updater]);

	const contextValue = useMemo(() => [requests, setRequests], [requests, setRequests]);

	return (
		<RequestsSettings.Provider value={contextValue}>
			{children}
		</RequestsSettings.Provider>
	);
};
RequestsProvider.propTypes = {
	children: node,
	init: customPropTypes.requestsType,
	updater: func
};

const useRequestsSettings = () => {
	const context = useContext(RequestsSettings);

	return context;
};

const obfuscate = (val) => "*".repeat(val.length);

function DataRequest({ request }){
	const { apikey, dataURI, library, params = "" } = request;

	const libContents = useMemo(() => {
		const tagProps = library.startsWith("users/")
			? { icon: "user", htmlTitle: "User library" }
			: library.startsWith("groups/")
				? { icon: "people", htmlTitle: "Group library" }
				: {};
		return <Tag minimal={true} {...tagProps}>{library}</Tag>;
	}, [library]);

	return <div className="zr-settings--card">
		<div zr-role="settings-row">
			<span className={CustomClasses.TEXT_AUXILIARY}>Library</span>
			<div>
				{libContents}
			</div>
		</div>
		<div zr-role="settings-row">
			<span className={CustomClasses.TEXT_AUXILIARY}>Data URI</span>
			<div>
				{dataURI && <span>{dataURI}</span>}
			</div>
		</div>
		<div zr-role="settings-row">
			<span className={CustomClasses.TEXT_AUXILIARY}>API Key</span>
			<div>
				{apikey && <span>{obfuscate(apikey)}</span>}
			</div>
		</div>
		<div zr-role="settings-row">
			<span className={CustomClasses.TEXT_AUXILIARY}>Parameters</span>
			<div>
				<span>{params || "None"}</span>
			</div>
		</div>
	</div>;
}
DataRequest.propTypes = {
	request: customPropTypes.dataRequestType
};

function RequestsWidget(){
	const [
		{
			apiKeys,
			dataRequests,
			libraries
		},
		setOpts
	] = useRequestsSettings();

	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);

	return <>
		<RowCol title="Data Requests" description="Choose which items to sync from Zotero" rightElement={<Button className={CustomClasses.TEXT_SMALL} icon={dataRequests.length == 0 ? "arrow-right" : "settings"} intent={dataRequests.length == 0 ? "warning" : "primary"} minimal={true} onClick={openDialog} text={dataRequests.length == 0 ? "Add requests to complete setup" : "Edit"} />}>
			{dataRequests.map((req) => <DataRequest key={req.name} request={req} />)}
		</RowCol>
		<Dialog isOpen={isDialogOpen} onClose={closeDialog}>
			<div className={Classes.DIALOG_BODY}>
				{JSON.stringify(apiKeys)}
				{JSON.stringify(libraries)}
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button minimal={true} onClick={closeDialog} text="Cancel" />
					<Button intent="primary" minimal={true} onClick={setOpts} text="OK" />
				</div>
			</div>
		</Dialog>
	</>;
}

export {
	RequestsProvider,
	RequestsWidget,
	useRequestsSettings
};