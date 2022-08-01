import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

import { Toggle } from "../common";

import * as customPropTypes from "../../../propTypes";

const OtherSettings = React.createContext({});

const OtherSettingsProvider = ({ children, init, updater }) => {
	const [other, _setOther] = useState(init);

	const setOther = useCallback((updateFn) => {
		_setOther((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			return update;
		});
	}, [updater]);

	const contextValue = useMemo(() => [other, setOther], [other, setOther]);

	return (
		<OtherSettings.Provider value={contextValue}>
			{children}
		</OtherSettings.Provider>
	);
};
OtherSettingsProvider.propTypes = {
	children: node,
	init: customPropTypes.otherSettingsType,
	updater: func
};

const useOtherSettings = () => {
	const context = useContext(OtherSettings);

	return context;
};

function OtherSettingsWidget() {
	const [
		{
			autoload,
			darkTheme,
			render_inline,
			shareErrors
		},
		setOpts
	] = useOtherSettings();

	const handlers = useMemo(() => {

		function toggleBool(op){
			setOpts(prevState => ({
				...prevState,
				[op]: !prevState[op]
			}));
		}

		return {
			toggleAutoload: () => toggleBool("autoload"),
			toggleDarkTheme: () => toggleBool("darkTheme"),
			toggleRenderInline: () => toggleBool("render_inline"),
			toggleShareErrors: () => toggleBool("shareErrors"),
		};
	}, [setOpts]);

	return <>
		<Toggle description="Activate the extension on graph load" isChecked={autoload} label="Toggle 'autoload' setting" onChange={handlers.toggleAutoload} title="Autoload" />
		<Toggle description="Should dark theme be used by default?" isChecked={darkTheme} label="Toggle 'dark theme' setting" onChange={handlers.toggleDarkTheme} title="Use Dark Theme by default" />
		<Toggle description="This will display [[@citekey]] references as a formatted citation, like Scott et al. (2003). Block content will not be affected." isChecked={render_inline} label="Toggle 'render inline' setting" onChange={handlers.toggleRenderInline} title="Display references as citations" />
		<Toggle description="Automatically share error reports" isChecked={shareErrors} label="Toggle 'share errors' setting" onChange={handlers.toggleShareErrors} title="Share Errors" />
	</>;

}

export {
	OtherSettingsProvider,
	OtherSettingsWidget,
	useOtherSettings
};