/* istanbul ignore file */
import { render } from "react-dom";

import { HotkeysProvider } from "@blueprintjs/core";
import { init as SentryInit } from "@sentry/react";

import { AppWrapper, queryClient } from "Components/App";
import { UserSettingsProvider } from "Components/UserSettings";
import zrToaster from "Components/ExtensionToaster";

import { EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, EXTENSION_VERSION, SENTRY_CONFIG } from "./constants";
import { initialize, setup, setupPortals, setupSentry  } from "./setup";
import ZoteroRoam from "./extension";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "./index.css";


(() => {

	const INSTALL_CONTEXT = "roam/js";

	SentryInit(SENTRY_CONFIG);

	setupPortals();

	const manualSettings = window.zoteroRoam_settings;

	try {

		const { requests, settings } = initialize(INSTALL_CONTEXT, { manualSettings });

		window.zoteroRoam = new ZoteroRoam({
			queryClient,
			requests,
			settings,
		});

		// https://github.com/getsentry/sentry-javascript/issues/2039
		setupSentry(settings.other.shareErrors, {
			install: INSTALL_CONTEXT,
			version: EXTENSION_VERSION
		});

		setup({ settings });

		render(
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