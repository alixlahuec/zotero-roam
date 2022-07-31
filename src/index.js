/* istanbul ignore file */
import React from "react";
import { render } from "react-dom";
import * as Sentry from "@sentry/react";
import { HotkeysProvider } from "@blueprintjs/core";

import { AppWrapper, queryClient } from "./components/App";
import { UserSettingsProvider } from "./components/UserSettings";
import zrToaster from "./components/ExtensionToaster";

import { setDefaultHooks } from "./events";
import { initialize, setupDarkTheme, setupDependencies, setupPortals, setupSentry  } from "./setup";
import { registerSmartblockCommands } from "./smartblocks";

import { EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, EXTENSION_VERSION, SENTRY_CONFIG } from "./constants";

// TODO: remove once revert to Blueprint v3 is completed
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import "./index.css";


(async() => {

	const INSTALL_CONTEXT = "roam/js";

	Sentry.init(SENTRY_CONFIG);

	setupPortals();

	const manualSettings = window.zoteroRoam_settings;

	try {

		const { requests, settings } = await initialize(INSTALL_CONTEXT, { manualSettings });

		window.zoteroRoam.formatNotes = formatNotes;
		window.zoteroRoam.formatPDFs = formatPDFs;
		window.zoteroRoam.getChildren = getChildren;
		window.zoteroRoam = new ZoteroRoam({
			queryClient,
			requests,
			settings,
		});

		// https://github.com/getsentry/sentry-javascript/issues/2039
		setupSentry(settings.shareErrors, {
			install: "roam/js",
			rawRequests: manualSettings.dataRequests,
			version: EXTENSION_VERSION,
			...settings
		});

		registerSmartblockCommands(getItems);

		render(
			<HotkeysProvider dialogProps={{globalGroupName: "zoteroRoam"}}>
				<App
					extension={{
			<HotkeysProvider dialogProps={{ globalGroupName: "zoteroRoam" }}>
				<UserSettingsProvider extensionAPI={null} init={{ ...settings, requests }}>
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
	} catch (e) {
		console.error(e);
		zrToaster.show({
			intent: "danger",
			message: "zoteroRoam : " + e.message
		});
	}

})();