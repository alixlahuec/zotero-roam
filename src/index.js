/* istanbul ignore file */
import React from "react";
import { render } from "react-dom";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { HotkeysProvider } from "@blueprintjs/core";

import zrToaster from "./components/ExtensionToaster";

import { App, getBibEntries, getBibliography, getChildren, getCollections, getItems, getTags } from "./components/App";
import { setDefaultHooks } from "./events";
import { formatNotes, formatPDFs, getItemCreators, getItemTags, _getItemCollections, _getItemMetadata, _getItemRelated, _getItemType } from "./public";
import { registerSmartblockCommands } from "./smartblocks";
import { setupDarkTheme, _setupDataRequests, setupDependencies, setupPortals, setupSentry, setupInitialSettings } from "./utils";

import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "@blueprintjs/datetime/lib/css/blueprint-datetime.css";
import "./index.css";

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

window.zoteroRoam = {};

(()=>{

	const extension = {
		version: "0.7.0",
		portalId: "zotero-roam-portal"
	};

	const extensionSlot = "zotero-roam-slot";
	setupPortals(extensionSlot, extension.portalId);

	const {
		darkTheme,
		dataRequests
	} = window.zoteroRoam_settings;

	// Use object merging to handle undefined settings
	window.zoteroRoam.config = {
		version: extension.version,
		userSettings: setupInitialSettings(window.zoteroRoam_settings)
	};

	// https://github.com/getsentry/sentry-javascript/issues/2039
	setupSentry(window.zoteroRoam.config.userSettings.shareErrors, {
		install: "roam/js",
		rawRequests: dataRequests,
		version: window.zoteroRoam.config.version,
		...window.zoteroRoam.config.userSettings
	});

	window.zoteroRoam.formatNotes = formatNotes;
	window.zoteroRoam.formatPDFs = formatPDFs;
	window.zoteroRoam.getChildren = getChildren;
	window.zoteroRoam.getItems = getItems;
	window.zoteroRoam.getItemCreators = getItemCreators;
	window.zoteroRoam.getItemTags = getItemTags;

	try {
		const requests = _setupDataRequests(dataRequests, {
			getBibEntries, getBibliography, getCollections, _getItemCollections, getTags
		});
		
		window.zoteroRoam.config.requests = requests;

		window.zoteroRoam.getItemMetadata = (item, pdfs, notes) => _getItemMetadata(item, pdfs, notes, window.zoteroRoam.config.userSettings.typemap, window.zoteroRoam.config.userSettings.notes, window.zoteroRoam.config.userSettings.annotations);

		window.zoteroRoam.getItemRelated = (item, { return_as = "citekeys", brackets = true } = {}) => {
			const { type: libType, id: libID } = item.library;
			const datastore = getItems("items").filter(it => it.library.id == libID && it.library.type == libType);
			
			return _getItemRelated(item, datastore, { return_as, brackets });
		};

		window.zoteroRoam.getItemType = (item, { brackets = true } = {}) => _getItemType(item, window.zoteroRoam.config.userSettings.typemap, { brackets });

		setupDarkTheme(darkTheme);
		setupDependencies([
			{ id: "scite-badge", src: "https://cdn.scite.ai/badge/scite-badge-latest.min.js"}
		]);
		setDefaultHooks();
		registerSmartblockCommands(getItems);

		render(
			<HotkeysProvider dialogProps={{globalGroupName: "zoteroRoam"}}>
				<App
					extension={{...extension, ...requests}}
					userSettings={window.zoteroRoam.config.userSettings}
				/>
			</HotkeysProvider>, 
			document.getElementById(extensionSlot)
		);
	} catch (e) {
		console.error(e);
		zrToaster.show({
			intent: "danger",
			message: "zoteroRoam : " + e.message
		});
	}

})();