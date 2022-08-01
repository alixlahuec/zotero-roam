import React, { useCallback } from "react";
import { node, object } from "prop-types";

import { SETTINGS_CONFIG } from "./mapping";

import * as customPropTypes from "../../propTypes";

// https://stackoverflow.com/questions/51504506/too-many-react-context-providers
function UserSettingsProvider({ extensionAPI = {}, children, init }){
	const updater = useCallback((id, val) => {
		if(!extensionAPI.settings){
			return null;
		} else {
			console.log(extensionAPI, id, val);
			extensionAPI.settings.set(id, val);
		}
	}, [extensionAPI]);

	return SETTINGS_CONFIG.reduceRight((acc, provider) => {
		const { component: Comp, id } = provider;
		return <Comp init={init[id]} updater={(val) => updater(id, val)} >{acc}</Comp>;
	}, children);
}
UserSettingsProvider.propTypes = {
	extensionAPI: object,
	children: node,
	init: customPropTypes.initSettingsType
};

export default UserSettingsProvider;