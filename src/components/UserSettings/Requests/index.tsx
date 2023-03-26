import { useCallback } from "react";
import { Button, Dialog } from "@blueprintjs/core";

import DataRequest from "./DataRequest";
import RequestsEditor from "./RequestsEditor";
import { RowCol , SettingsManager } from "Components/UserSettings";

import { useBool } from "../../../hooks";
import { CustomClasses } from "../../../constants";


const { Provider: RequestsProvider, useSettings: useRequestsSettings } = new SettingsManager<"requests">({
	afterUpdate: (_prevState, update) => {
		window?.zoteroRoam?.updateLibraries?.(update.libraries);
	}
});

function RequestsWidget(){
	const [
		{
			/*apiKeys,*/
			dataRequests,
			/*libraries*/
		},
		setOpts
	] = useRequestsSettings();

	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);

	const updateRequests = useCallback((val) => setOpts(_prevState => val), [setOpts]);

	return <>
		<RowCol title="Data Requests" description="Choose which items to sync from Zotero" rightElement={<Button className={CustomClasses.TEXT_SMALL} icon={dataRequests.length == 0 ? "arrow-right" : null} intent="warning" minimal={true} onClick={openDialog} text={dataRequests.length == 0 ? "Add request" : "Edit"} />}>
			{dataRequests.map((req) => <DataRequest key={req.name} request={req} />)}
		</RowCol>
		<Dialog className="zr-data-requests-dialog" isOpen={isDialogOpen} onClose={closeDialog}>
			<RequestsEditor closeDialog={closeDialog} dataRequests={dataRequests} updateRequests={updateRequests} />
		</Dialog>
	</>;
}

export {
	RequestsProvider,
	useRequestsSettings,
	RequestsWidget
};