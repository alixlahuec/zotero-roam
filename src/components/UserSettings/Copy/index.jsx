import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

import { RowGroup, RowGroupOption, SingleInput, TextField, Toggle } from "../common";

import * as customPropTypes from "../../../propTypes";

const CopySettings = createContext({});

const CopyProvider = ({ children, init, updater }) => {
	const [copy, _setCopy] = useState(init);

	const setCopy = useCallback((updateFn) => {
		_setCopy((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			return update;
		});
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

const PRESET_OPTIONS = [
	{ label: "Citation", value: "citation" },
	{ label: "Citekey", value: "citekey" },
	{ label: "Page reference", value: "page-reference" },
	{ label: "Raw", value: "raw" },
	{ label: "Tag", value: "tag" }
];

const USE_OPTIONS = {
	"preset": "Preset",
	"template": "Custom template"
};

/**
 * Options for Quick Copy's override key
 * @readonly
 * @enum {{label: String, value: String}}
 */
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
			overrideKey,
			preset,
			template,
			useAsDefault,
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

		function updateSingleValue(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			toggleAlwaysCopy: () => toggleBool("always"),
			updateOverrideKey: (val) => updateSingleValue("overrideKey", val),
			updatePresetFormat: (val) => updateSingleValue("preset", val),
			updateTemplate: (val) => updateSingleValue("template", val),
			updateUseType: (val) => updateSingleValue("useAsDefault", val),
			toggleQuickCopy: () => toggleBool("useQuickCopy")
		};
	}, [setOpts]);

	return <>
		<Toggle description="Whether to always copy an item's reference in library search" isChecked={always} label="Toggle 'always copy' setting" onChange={handlers.toggleAlwaysCopy} title="Always copy" />
		<RowGroup title="Format"
			description="The default formatting to use when copying an item's reference"
			onChange={handlers.updateUseType}
			options={USE_OPTIONS}
			selected={useAsDefault} >
			<RowGroupOption id="preset">
				<SingleInput menuTitle="Select a formatting preset" onChange={handlers.updatePresetFormat} options={PRESET_OPTIONS} value={preset} />
			</RowGroupOption>
			<RowGroupOption id="template" description="Available replacements: {{key}} will insert the item's citekey (without @) ; {{authors}} = the item's creators summary (e.g Author et al.) ; {{title}} = the item's title ; {{year}} = the item's year of publication." >
				<TextField ifEmpty={true} label="Enter a custom formatting template" onChange={handlers.updateTemplate} value={template} />
			</RowGroupOption>
		</RowGroup>
		<SingleInput description="The key to hold to override QuickCopy" menuTitle="Select an override key for Quick Copy" onChange={handlers.updateOverrideKey} options={OVERRIDE_KEY_OPTIONS} title="Override Key" value={overrideKey} />
		<Toggle description="Should QuickCopy be enabled by default?" isChecked={useQuickCopy} label="Toggle 'use quick copy by default' setting" onChange={handlers.toggleQuickCopy} title="Use Quick Copy (default)" />
	</>;
}

export {
	CopyProvider,
	CopyWidget,
	useCopySettings
};