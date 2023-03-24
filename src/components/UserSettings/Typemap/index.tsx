import { func, node, objectOf, string } from "prop-types";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { TextField } from "../common";
import { camelToTitleCase } from "../../../utils";
import { SettingsManager } from "../Manager";


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