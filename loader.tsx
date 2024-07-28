/* istanbul ignore file */
import { render } from "react-dom";
import { HotkeysProvider } from "@blueprintjs/core";

import { AppWrapper, queryClient } from "Components/App";
import ClearCacheButton from "Components/ClearCacheButton";
import { UserSettingsProvider } from "Components/UserSettings";

import ZoteroRoam from "./src/api";
import { clearDefaultHooks } from "@services/events";
import IDBDatabase from "@services/idb";
import { unregisterSmartblockCommands } from "@services/smartblocks";
import { initialize, setup, setupPortals, unmountExtensionIfExists } from "./src/setup";

import { EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, EXTENSION_VERSION } from "./src/constants";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "./styles/_index.sass";


/** @constant {ExtensionSettingsConfig} */
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

/**
 * @param {{extensionAPI: Roam.ExtensionAPI}} param0 
 */
function onload({ extensionAPI }){

	const INSTALL_CONTEXT = "roam/depot";

	setupPortals();

	const { requests, settings } = initialize({ context: INSTALL_CONTEXT, extensionAPI });

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
						version: EXTENSION_VERSION
					}}
					extensionAPI={extensionAPI}
					idbDatabase={idbDatabase}
				/>
			</UserSettingsProvider>
		</HotkeysProvider>, 
		document.getElementById(EXTENSION_SLOT_ID)
	);
}

function offload(){
	clearDefaultHooks();
	unregisterSmartblockCommands();
	unmountExtensionIfExists();
	window.zoteroRoam.deleteDatabase();
	// @ts-ignore
	delete window.zoteroRoam;
}

export default {
	onload: onload,
	onunload: offload
};