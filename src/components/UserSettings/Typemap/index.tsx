import { useCallback } from "react";
import { SettingsManager, TextField } from "Components/UserSettings";

import { camelToTitleCase } from "../../../utils";


const { Provider: TypemapProvider, useSettings: useTypemapSettings } = new SettingsManager<"typemap">({
	afterUpdate: (_prevState, update) => {
		window?.zoteroRoam?.updateSetting?.("typemap", update);
	}
});

function TypemapWidget(){
	const [
		typemap,
		setOpts
	] = useTypemapSettings();

	const updateValue = useCallback((type, val) => {
		setOpts(prevState => ({
			...prevState,
			[type]: val
		}));
	}, [setOpts]);

	return Object.keys(typemap).map(type => (
		<TextField key={type} ifEmpty={true} label={"Enter a mapping for" + camelToTitleCase(type)} onChange={(val) => updateValue(type, val)} title={type} value={typemap[type]} />
	));
}

export {
	TypemapProvider,
	TypemapWidget,
	useTypemapSettings
};