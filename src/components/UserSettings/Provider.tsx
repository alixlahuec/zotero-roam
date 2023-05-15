import { FC, ReactChildren, useCallback } from "react";

import { SETTINGS_CONFIG } from "./mapping";

import { Roam } from "Types/externals";
import { InitSettings } from "Types/extension";


type OwnProps = {
	extensionAPI?: Roam.ExtensionAPI,
	init: InitSettings
};

// https://stackoverflow.com/questions/51504506/too-many-react-context-providers
const UserSettingsProvider: FC<OwnProps> = ({ extensionAPI = {}, children, init }) => {
	const updater = useCallback((id, val) => {
		if (!extensionAPI.settings) {
			return null;
		} else {
			extensionAPI.settings.set(id, val);
		}
	}, [extensionAPI]);

	return <>
		{SETTINGS_CONFIG.reduceRight((acc: ReactChildren, provider) => {
			const { component: Comp, id } = provider;
			return <Comp children={acc} init={init[id]} updater={(val) => updater(id, val)} />;
		}, children)}
	</>;
};


export { UserSettingsProvider };