/* istanbul ignore file */
import React from "react";
import { render } from "react-dom";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { HotkeysProvider } from "@blueprintjs/core";

import zrToaster from "./components/ExtensionToaster";

import { EXTENSION_PORTAL_ID, EXTENSION_SLOT_ID, EXTENSION_VERSION } from "./constants";

import { App, getBibEntries, getBibliography, getChildren, getCollections, getItems, getTags } from "./components/App";
import { setDefaultHooks } from "./events";
import { formatNotes, formatPDFs, getItemCreators, getItemTags, _getItemCollections, _getItemMetadata, _getItemRelated, _getItemType } from "./public";
import { initialize, setupDarkTheme, setupDependencies, setupPortals, setupSentry  } from "./setup";
import { registerSmartblockCommands } from "./smartblocks";

// TODO: remove once revert to Blueprint v3 is completed
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import "./index.css";


(async()=>{

	window.zoteroRoam = {};

	Sentry.init({
		autoSessionTracking: false,
		beforeSend: (event) => {
			// https://romain-clement.net/articles/sentry-url-fragments/
			if(event.request?.url) {
				event.request.url = event.request.url.split("#")[0];
			}
    
			if(!event.exception.values.some(val => val.stacktrace.frames.some(frame => frame.module.includes("zotero-roam/./src")))){
				return null;
			}
    
			return event;
		},
		dsn: "https://8ff22f45be0a49c3a884f9ad2da4bd20@o1285244.ingest.sentry.io/6496372",
		integrations: [new BrowserTracing()],
      
		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0
	});

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