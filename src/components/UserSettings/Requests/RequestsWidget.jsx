import { useCallback } from "react";

import { Button, Dialog } from "@blueprintjs/core";
import DataRequest from "./DataRequest";
import RequestsEditor from "./RequestsEditor";
import { RowCol } from "../common";

import { useBool } from "../../../hooks";
import { useRequestsSettings } from ".";

import { CustomClasses } from "../../../constants";


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

export default RequestsWidget;