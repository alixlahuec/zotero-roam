/* istanbul ignore file */
import { render } from "react-dom";

import { init as SentryInit, getCurrentHub as getSentryHub } from "@sentry/react";
import { HotkeysProvider } from "@blueprintjs/core";

import { AppWrapper, queryClient } from "./src/components/App";
import { UserSettingsProvider } from "./src/components/UserSettings";

import { initialize, setup, setupPortals, setupSentry, unmountExtensionIfExists } from "./src/setup";

import { EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, EXTENSION_VERSION, SENTRY_CONFIG } from "./src/constants";
import ZoteroRoam from "./src/extension";


import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "./src/index.css";


function onload({ extensionAPI }){

	const INSTALL_CONTEXT = "roam/depot";
	
	SentryInit(SENTRY_CONFIG);

	setupPortals();

	const { requests, settings } = initialize(INSTALL_CONTEXT, { extensionAPI });

	window.zoteroRoam = new ZoteroRoam({
		queryClient,
		requests,
		settings
	});

	// https://github.com/getsentry/sentry-javascript/issues/2039
	setupSentry(settings.other.shareErrors, {
		install: INSTALL_CONTEXT,
		version: EXTENSION_VERSION
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
	getSentryHub().getClient().close();
	unmountExtensionIfExists();
	delete window.zoteroRoam;
}

export default {
	onload: onload,
	onunload: offload
};