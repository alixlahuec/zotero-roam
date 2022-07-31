import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node, objectOf, string } from "prop-types";


const ShortcutsSettings = React.createContext({});

const ShortcutsProvider = ({ children, init, updater }) => {
	const [shortcuts, _setShortcuts] = useState(init);

	const setShortcuts = useCallback((val) => {
		_setShortcuts(val);
		updater(val);
	}, [updater]);

	const contextValue = useMemo(() => [shortcuts, setShortcuts], [shortcuts, setShortcuts]);

	return (
		<ShortcutsSettings.Provider value={contextValue}>
			{children}
		</ShortcutsSettings.Provider>
	);
};
ShortcutsProvider.propTypes = {
	children: node,
	init: objectOf(string),
	updater: func
};

const useShortcutsSettings = () => {
	const context = useContext(ShortcutsSettings);

	return context;
};

export {
	ShortcutsProvider,
	useShortcutsSettings
};