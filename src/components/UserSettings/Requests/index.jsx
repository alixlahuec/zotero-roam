import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

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

export {
	RequestsProvider,
	useRequestsSettings
};