/* istanbul ignore file */
import React from "react";
import { render } from "react-dom";
import * as Sentry from "@sentry/react";
import { HotkeysProvider } from "@blueprintjs/core";

import { App, getBibEntries, getBibliography, getChildren, getCollections, getItems, getTags } from "./components/App";
import zrToaster from "./components/ExtensionToaster";

import { setDefaultHooks } from "./events";
import { formatNotes, formatPDFs, getItemCreators, getItemTags, _getItemCollections, _getItemMetadata, _getItemRelated, _getItemType } from "./public";
import { initialize, setupDarkTheme, setupDependencies, setupPortals, setupSentry  } from "./setup";
import { registerSmartblockCommands } from "./smartblocks";

import { EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, EXTENSION_VERSION, SENTRY_CONFIG } from "./constants";

// TODO: remove once revert to Blueprint v3 is completed
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import "./index.css";


(async()=>{

	window.zoteroRoam = {};

	Sentry.init(SENTRY_CONFIG);

	setupPortals();

	const manualSettings = window.zoteroRoam_settings;

	try {

		const { requests, settings } = await initialize("roam/js", { 
			manualSettings,
			utils: {
				getBibEntries,
				getBibliography,
				getCollections,
				_getItemCollections,
				_getItemMetadata,
				_getItemType,
				getTags
			}
		});

		window.zoteroRoam.formatNotes = formatNotes;
		window.zoteroRoam.formatPDFs = formatPDFs;
		window.zoteroRoam.getChildren = getChildren;
		window.zoteroRoam.getItems = getItems;
		window.zoteroRoam.getItemCreators = getItemCreators;
		window.zoteroRoam.getItemTags = getItemTags;
		window.zoteroRoam.getItemRelated = (item, { return_as = "citekeys", brackets = true } = {}) => {
			const { type: libType, id: libID } = item.library;
			const datastore = getItems("items").filter(it => it.library.id == libID && it.library.type == libType);
			
			return _getItemRelated(item, datastore, { return_as, brackets });
		};

		setupDarkTheme(settings.darkTheme);
		setupDependencies();
		setDefaultHooks();
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
						portalId: EXTENSION_PORTAL_ID,
						version: EXTENSION_VERSION,
						...requests
					}}
					userSettings={window.zoteroRoam.config.userSettings}
				/>
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