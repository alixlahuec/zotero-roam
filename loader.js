/* istanbul ignore file */
import { render } from "react-dom";
import { HotkeysProvider } from "@blueprintjs/core";

import { AppWrapper, queryClient } from "Components/App";
import { UserSettingsProvider } from "Components/UserSettings";

import { initialize, setup, setupPortals, unmountExtensionIfExists } from "./src/setup";

import { EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, EXTENSION_VERSION } from "./src/constants";
import ZoteroRoam from "./src/extension";


import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "./src/index.css";
import { unregisterSmartblockCommands } from "src/smartblocks";


function onload({ extensionAPI }){

	const INSTALL_CONTEXT = "roam/depot";

	setupPortals();

	const { requests, settings } = initialize(INSTALL_CONTEXT, { extensionAPI });

	window.zoteroRoam = new ZoteroRoam({
		queryClient,
		requests,
		settings
	});

	setup({ settings });

	render(
		<HotkeysProvider dialogProps={{ globalGroupName: "zoteroRoam" }}>
			<UserSettingsProvider extensionAPI={extensionAPI} init={{ ...settings, requests }}>
				<AppWrapper
					extension={{
						portalId: EXTENSION_PORTAL_ID,
						version: EXTENSION_VERSION,
					}}
				/>
			</UserSettingsProvider>
		</HotkeysProvider>, 
		document.getElementById(EXTENSION_SLOT_ID)
	);
}

function offload(){
	unregisterSmartblockCommands();
	unmountExtensionIfExists();
	delete window.zoteroRoam;
}

export default {
	onload: onload,
	onunload: offload
};