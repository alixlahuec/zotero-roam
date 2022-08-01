import React, { useCallback, useContext, useMemo, useState } from "react";
import { func, node } from "prop-types";

import * as customPropTypes from "../../../propTypes";
import { SingleInput, TextField } from "../common";

const AutocompleteSettings = React.createContext({});

const AutocompleteProvider = ({ children, init, updater }) => {
	const [autocomplete, _setAutocomplete] = useState(init);

	const setAutocomplete = useCallback((updateFn) => {
		_setAutocomplete((prevState) => {
			const update = updateFn(prevState);
			updater(update);
			return update;
		});
	}, [updater]);

	const contextValue = useMemo(() => [autocomplete, setAutocomplete], [autocomplete, setAutocomplete]);

	return (
		<AutocompleteSettings.Provider value={contextValue}>
			{children}
		</AutocompleteSettings.Provider>
	);
};
AutocompleteProvider.propTypes = {
	children: node,
	init: customPropTypes.autocompleteSettingsType,
	updater: func
};

const useAutocompleteSettings = () => {
	const context = useContext(AutocompleteSettings);

	return context;
};

const DISPLAY_OPTIONS = [
	{ label: "Citation", value: "citation" },
	{ label: "Citekey", value: "citekey" },
	{ label: "Inline", value: "inline" },
	{ label: "Page reference", value: "pageref" },
	{ label: "Popover", value: "popover" },
	{ label: "Tag", value: "tag" },
	{ label: "Zettlr", value: "zettlr" }
];

const FORMAT_OPTIONS = [
	{ label: "Citation", value: "citation" },
	{ label: "Citekey", value: "citekey" },
	{ label: "Inline", value: "inline" },
	{ label: "Page reference", value: "pageref" },
	{ label: "Popover", value: "popover" },
	{ label: "Tag", value: "tag" },
	{ label: "Zettlr", value: "zettlr" }
];

function AutocompleteWidget(){
	const [
		{
			display,
			format,
			trigger
		}, 
		setOpts
	] = useAutocompleteSettings();

	const handlers = useMemo(() => {

		function updateText(op, val){
			setOpts(prevState => ({
				...prevState,
				[op]: val
			}));
		}

		return {
			updateDisplay: (val) => updateText("display", val),
			updateFormat: (val) => updateText("format", val),
			updateTrigger: (val) => updateText("trigger", val)
		};
	}, [setOpts]);

	return <>
		<SingleInput description="The format in which to display suggestions" menuTitle="Select a display format" onChange={handlers.updateDisplay} options={DISPLAY_OPTIONS} title="Display" value={display} />
		<SingleInput description="The format in which to insert the reference" menuTitle="Select a formatting option" onChange={handlers.updateFormat} options={FORMAT_OPTIONS} title="Format" value={format} />
		<TextField description="The character(s) that should trigger the autocomplete" ifEmpty={true} label="Enter a trigger for the 'autocomplete' feature" onChange={handlers.updateTrigger} placeholder="Enter a value to enable the feature" title="Trigger" value={trigger} />
	</>;
}

export {
	AutocompleteProvider,
	AutocompleteWidget,
	useAutocompleteSettings
};