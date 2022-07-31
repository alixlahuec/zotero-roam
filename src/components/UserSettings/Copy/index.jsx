import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

import { SingleInput, Toggle } from "../common";

import * as customPropTypes from "../../../propTypes";

const CopySettings = React.createContext({});

const CopyProvider = ({ children, init, updater }) => {
	const [copy, _setCopy] = useState(init);

	const setCopy = useCallback((val) => {
		_setCopy(val);
		updater(val);
	}, [updater]);

	const contextValue = useMemo(() => [copy, setCopy], [copy, setCopy]);

	return (
		<CopySettings.Provider value={contextValue}>
			{children}
		</CopySettings.Provider>
	);
};
CopyProvider.propTypes = {
	children: node,
	init: customPropTypes.copySettingsType,
	updater: func
};

const useCopySettings = () => {
	const context = useContext(CopySettings);

	return context;
};

// TODO: re-allow the use of a function
const FORMAT_OPTIONS = [
	{ label: "Citation", value: "citation" },
	{ label: "Citekey", value: "citekey" },
	{ label: "Page reference", value: "page-reference" },
	{ label: "Raw", value: "raw" },
	{ label: "Tag", value: "tag" }
];

export const OVERRIDE_KEY_OPTIONS = [
	{ label: "Alt", value: "altKey" },
	{ label: "Ctrl", value: "ctrlKey" },
	{ label: "Shift", value: "shiftKey" },
	{ label: "System key", value: "metaKey" },
];

function CopyWidget(){
	const [
		{
			always,
			defaultFormat,
			overrideKey,
			useQuickCopy
		},
		setOpts
	] = useCopySettings();

	const handlers = useMemo(() => {

		function toggleBool(op){
			setOpts(prevState => ({
				...prevState,
				[op]: !prevState[op]
			}));
		}

		function updateText(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			toggleAlwaysCopy: () => toggleBool("always"),
			updateFormat: (val) => updateText("defaultFormat", val),
			updateOverrideKey: (val) => updateText("overrideKey", val),
			toggleQuickCopy: () => toggleBool("useQuickCopy")
		};
	}, [setOpts]);

	return <>
		<Toggle description="Whether to always copy an item's reference in library search" isChecked={always} label="Toggle 'always copy' setting" onChange={handlers.toggleAlwaysCopy} title="Always copy" />
		<SingleInput description="The default formatting to use when copying an item's reference" menuTitle="Select a default formatting" onChange={handlers.updateFormat} options={FORMAT_OPTIONS} title="Format" value={defaultFormat} />
		<SingleInput description="The key to hold to override QuickCopy" menuTitle="Select an override key for Quick Copy" onChange={handlers.updateOverrideKey} options={OVERRIDE_KEY_OPTIONS} title="Override Key" value={overrideKey} />
		<Toggle description="Should QuickCopy be enabled by default?" isChecked={useQuickCopy} label="Toggle 'use quick copy by default' setting" onChange={handlers.toggleQuickCopy} title="Use Quick Copy (default)" />
	</>;
}

export {
	CopyProvider,
	CopyWidget,
	useCopySettings
};