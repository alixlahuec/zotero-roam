/* istanbul ignore file */
import { render } from "react-dom";
import { HotkeysProvider } from "@blueprintjs/core";

import { AppWrapper, queryClient } from "Components/App";
import ClearCacheButton from "Components/ClearCacheButton";
import { UserSettingsProvider } from "Components/UserSettings";

import IDBDatabase from "./src/services/idb";
import ZoteroRoam from "./src/extension";
import { initialize, setup, setupPortals, unmountExtensionIfExists } from "./src/setup";
import { unregisterSmartblockCommands } from "./src/smartblocks";

import { EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, EXTENSION_VERSION } from "./src/constants";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "./src/index.css";


const panelConfig = {
	tabTitle: "zoteroRoam",
	settings: [
		{
			id: "cache-clear",
			name: "Clear cache",
			description: "Remove all data from the extension's local cache.",
			action: {
				type: "reactComponent",
				component: ClearCacheButton
			}
		}
	]
};

function onload({ extensionAPI }){

	const INSTALL_CONTEXT = "roam/depot";

	setupPortals();

	const { requests, settings } = initialize(INSTALL_CONTEXT, { extensionAPI });

	const idbDatabase = new IDBDatabase();

	window.zoteroRoam = new ZoteroRoam({
		idbDatabase,
		queryClient,
		requests,
		settings
	});

	extensionAPI.settings.panel.create(panelConfig);
	setup({ settings });

	render(
		<HotkeysProvider dialogProps={{ globalGroupName: "zoteroRoam" }}>
			<UserSettingsProvider extensionAPI={extensionAPI} init={{ ...settings, requests }}>
				<AppWrapper
					extension={{
						portalId: EXTENSION_PORTAL_ID,
						version: EXTENSION_VERSION,
					}}
					idbDatabase={idbDatabase}
				/>
			</UserSettingsProvider>
		</HotkeysProvider>, 
		document.getElementById(EXTENSION_SLOT_ID)
	);
}

function offload(){
	unregisterSmartblockCommands();
	unmountExtensionIfExists();
	window.zoteroRoam.deleteDatabase();
	delete window.zoteroRoam;
}

export default {
	onload: onload,
	onunload: offload
};