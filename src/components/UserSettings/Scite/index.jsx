import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

import * as customPropTypes from "../../../propTypes";

const SciteSettings = React.createContext({});

const SciteProvider = ({ children, init, updater }) => {
	const [sciteBadge, _setSciteBadge] = useState(init);

	const setSciteBadge = useCallback((val) => {
		_setSciteBadge(val);
		updater(val);
	}, [updater]);

	const contextValue = useMemo(() => [sciteBadge, setSciteBadge], [sciteBadge, setSciteBadge]);

	return (
		<SciteSettings.Provider value={contextValue}>
			{children}
		</SciteSettings.Provider>
	);
};
SciteProvider.propTypes = {
	children: node,
	init: customPropTypes.sciteBadgeSettingsType,
	updater: func
};

const useSciteSettings = () => {
	const context = useContext(SciteSettings);

	return context;
};

export {
	SciteProvider,
	useSciteSettings
};