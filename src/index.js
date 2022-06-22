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
import { analyzeUserRequests, setupDarkTheme, setupDependencies, setupPortals } from "./utils";
import { default_typemap } from "./variables";

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

	let {
		annotations = {},
		autocomplete = {},
		autoload = false,
		copy = {},
		darkTheme = false,
		dataRequests = [],
		metadata = {},
		notes = {},
		pageMenu = {},
		render_inline = false,
		sciteBadge = {},
		shareErrors = true,
		shortcuts = {},
		typemap = {},
		webimport = {}
	} = window.zoteroRoam_settings;

	// Use object merging to handle undefined settings
	window.zoteroRoam.config = {
		version: extension.version,
		userSettings: {
			annotations: {
				comment_prefix: "",
				comment_suffix: "",
				group_by: false,
				highlight_prefix: "[[>]]",
				highlight_suffix: "([p. {{page_label}}]({{link_page}})) {{tags_string}}",
				use: "formatted",
				...annotations
			},
			autocomplete,
			autoload,
			copy: {
				always: false,
				defaultFormat: "citekey",
				overrideKey: "shiftKey",
				useQuickCopy: false,
				...copy
			},
			darkTheme,
			metadata: {
				use: "function",
				...metadata
			},
			notes: {
				split_char: "/n",
				use: "text",
				...notes
			},
			pageMenu: {
				defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"],
				trigger: (title) => title.length > 3 || false,
				...pageMenu
			},
			render_inline,
			sciteBadge: {
				layout: "horizontal",
				showLabels: false,
				showZero: true,
				small: false,
				tooltipPlacement: "auto",
				tooltipSlide: 0,
				...sciteBadge
			},
			shareErrors,
			shortcuts: {
				"copyDefault": false,
				"copyCitation": false,
				"copyCitekey": false,
				"copyPageRef": false,
				"copyTag": false,
				"focusSearchBar": false,
				"goToItemPage": false,
				"importMetadata": false,
				"toggleDashboard": false,
				"toggleNotes": "alt+N",
				"toggleSearchPanel": "alt+E",
				"toggleQuickCopy": false,
				...shortcuts
			},
			typemap: {
				...default_typemap,
				...typemap
			},
			webimport: {
				tags: [],
				...webimport
			}
		}
	};

	// https://github.com/getsentry/sentry-javascript/issues/2039
	if(window.zoteroRoam.config.userSettings.shareErrors == false){
		Sentry.getCurrentHub().getClient().getOptions().enabled = false;
	} else {
		Sentry.setContext("config", {
			rawRequests: dataRequests,
			version: window.zoteroRoam.config.version, 
			...window.zoteroRoam.config.userSettings 
		});
	}

	window.zoteroRoam.formatNotes = formatNotes;
	window.zoteroRoam.formatPDFs = formatPDFs;
	window.zoteroRoam.getChildren = getChildren;
	window.zoteroRoam.getItems = getItems;

	try {
		const requests = analyzeUserRequests(dataRequests);
		window.zoteroRoam.config.requests = requests;

		window.zoteroRoam.getBibEntries = async(citekeys) => {
			let { libraries } = requests;
			return await getBibEntries(citekeys, libraries);
		};

		window.zoteroRoam.getBibliography = async(item, config = {}) => {
			let { libraries } = requests;
			let location = item.library.type + "s/" + item.library.id;
			let library = libraries.find(lib => lib.path == location);

			return await getBibliography(item, library, config);
		};

		window.zoteroRoam.getItemCollections = (item, { brackets = true } = {}) => {
			let location = item.library.type + "s/" + item.library.id;
			let library = requests.libraries.find(lib => lib.path == location);
			let collectionList = getCollections(library);

			return _getItemCollections(item, collectionList, { brackets });
		};

		window.zoteroRoam.getItemCreators = getItemCreators;
		window.zoteroRoam.getItemTags = getItemTags;

		window.zoteroRoam.getItemMetadata = (item, pdfs, notes) => _getItemMetadata(item, pdfs, notes, window.zoteroRoam.config.userSettings.typemap, window.zoteroRoam.config.userSettings.notes, window.zoteroRoam.config.userSettings.annotations);

		window.zoteroRoam.getItemRelated = (item, { return_as = "citekeys", brackets = true } = {}) => {
			const { type: libType, id: libID } = item.library;
			const datastore = getItems("items").filter(it => it.library.id == libID && it.library.type == libType);
			
			return _getItemRelated(item, datastore, { return_as, brackets });
		};

		window.zoteroRoam.getItemType = (item, { brackets = true } = {}) => _getItemType(item, window.zoteroRoam.config.userSettings.typemap, { brackets });

		window.zoteroRoam.getTags = (location) => {
			let { libraries } = requests;
			let library = libraries.find(lib => lib.path == location);

			return getTags(library);
		};

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