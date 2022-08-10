import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

import * as customPropTypes from "../../../propTypes";


const ShortcutsSettings = createContext({});

const ShortcutsProvider = ({ children, init, updater }) => {
	const [shortcuts, _setShortcuts] = useState(init);

	const setShortcuts = useCallback((updateFn) => {
		_setShortcuts((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			return update;
		});
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
	init: customPropTypes.shortcutsSettingsType,
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