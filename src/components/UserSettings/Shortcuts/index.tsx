import { useCallback } from "react";
import { parseKeyCombo } from "@blueprintjs/core";

import { TextField, SettingsManager } from "Components/UserSettings";
import { camelToTitleCase, safely } from "../../../utils";


const { Provider: ShortcutsProvider, useSettings: useShortcutsSettings } = new SettingsManager<"shortcuts">();

const validateUserInput = (input) => {
	if(input == ""){ return true; }

	return safely(() => {
		parseKeyCombo(input);
		return true;
	}, false);
};

function ShortcutsWidget(){
	const [
		shortcuts,
		setOpts
	] = useShortcutsSettings();

	const updateValue = useCallback((cmd, val) => {
		setOpts(prevState => ({
			...prevState,
			[cmd]: val
		}));
	}, [setOpts]);

	return <>
		{Object.keys(shortcuts).map(cmd => (
			<TextField key={cmd} ifEmpty={true} label={"Enter a keyboard shortcut to use to" + camelToTitleCase(cmd)} onChange={(val) => updateValue(cmd, val)} title={camelToTitleCase(cmd)} validate={validateUserInput} value={shortcuts[cmd]} />
		))}
	</>;
}

export {
	ShortcutsProvider,
	ShortcutsWidget,
	useShortcutsSettings
};