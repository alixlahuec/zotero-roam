/* istanbul ignore file */
import { render } from "react-dom";
import { HotkeysProvider } from "@blueprintjs/core";

import { AppWrapper, queryClient } from "Components/App";
import { UserSettingsProvider } from "Components/UserSettings";
import zrToaster from "Components/ExtensionToaster";

import ZoteroRoam from "./api";
import IDBDatabase from "@services/idb";
import { initialize, setup, setupPortals } from "./setup";

import { DEFAULT_TOAST_TIMEOUT, EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, EXTENSION_VERSION } from "./constants";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "../styles/_index.sass";


(() => {

	const INSTALL_CONTEXT = "roam/js";

	setupPortals();

	const manualSettings = window.zoteroRoam_settings;

	try {

		const { requests, settings } = initialize({ context: INSTALL_CONTEXT, manualSettings });

		const idbDatabase = new IDBDatabase();

		window.zoteroRoam = new ZoteroRoam({
			idbDatabase,
			queryClient,
			requests,
			settings
		});

		setup({ settings });

		render(
			<HotkeysProvider dialogProps={{ globalGroupName: "zoteroRoam" }}>
				<UserSettingsProvider init={{ ...settings, requests }}>
					<AppWrapper
						extension={{
							portalId: EXTENSION_PORTAL_ID,
							version: EXTENSION_VERSION
						}}
						idbDatabase={idbDatabase}
					/>
				</UserSettingsProvider>
			</HotkeysProvider>, 
			document.getElementById(EXTENSION_SLOT_ID)
		);
	} catch (e) {
		console.error(e);
		zrToaster.show({
			intent: "danger",
			message: "zoteroRoam : " + e.message,
			timeout: DEFAULT_TOAST_TIMEOUT
		});
	}

})();