import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node, objectOf, string } from "prop-types";


const TypemapSettings = React.createContext({});

const TypemapProvider = ({ children, init, updater }) => {
	const [typemap, _setTypemap] = useState(init);

	const setTypemap = useCallback((val) => {
		_setTypemap(val);
		updater(val);
		window?.zoteroRoam?.updateSetting?.("annotations", val);
	}, [updater]);

	const contextValue = useMemo(() => [typemap, setTypemap], [typemap, setTypemap]);

	return (
		<TypemapSettings.Provider value={contextValue}>
			{children}
		</TypemapSettings.Provider>
	);
};
TypemapProvider.propTypes = {
	children: node,
	init: objectOf(string),
	updater: func
};

const useTypemapSettings = () => {
	const context = useContext(TypemapSettings);

	return context;
};

export {
	TypemapProvider,
	useTypemapSettings
};