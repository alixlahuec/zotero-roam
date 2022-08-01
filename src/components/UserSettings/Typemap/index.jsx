import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node, objectOf, string } from "prop-types";


const TypemapSettings = React.createContext({});

const TypemapProvider = ({ children, init, updater }) => {
	const [typemap, _setTypemap] = useState(init);

	const setTypemap = useCallback((updateFn) => {
		_setTypemap((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			window?.zoteroRoam?.updateSetting?.("annotations", update);
			return update;
		});
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