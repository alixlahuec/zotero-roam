import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

import * as customPropTypes from "../../../propTypes";
import { RoamTagsInput } from "../common";


const WebImportSettings = React.createContext({});

const WebImportProvider = ({ children, init, updater }) => {
	const [webImport, _setWebImport] = useState(init);

	const setWebImport = useCallback((val) => {
		_setWebImport(val);
		updater(val);
	}, [updater]);

	const contextValue = useMemo(() => [webImport, setWebImport], [webImport, setWebImport]);

	return (
		<WebImportSettings.Provider value={contextValue}>
			{children}
		</WebImportSettings.Provider>
	);
};
WebImportProvider.propTypes = {
	children: node,
	init: customPropTypes.webImportSettingsType,
	updater: func
};

const useWebImportSettings = () => {
	const context = useContext(WebImportSettings);

	return context;
};

function WebImportWidget(){
	const [
		{
			tags
		},
		setOpts
	] = useWebImportSettings();

	const handlers = useMemo(() => {
		function updateSingleValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			updateTags: (val) => updateSingleValue("tags", val)
		};
	}, [setOpts]);

	return <>
		<RoamTagsInput description="Select tags for which to show the import button" onChange={handlers.updateTags} title="Tags" value={tags} />
	</>;
}

export {
	WebImportProvider,
	WebImportWidget,
	useWebImportSettings
};