import React from "react";
import { render as ReactDOMRender } from "react-dom";
import { HotkeysProvider } from "@blueprintjs/core";

import zrToaster from "./components/ExtensionToaster";

import { App, getBibliography, getChildren, getCollections, getItems, getTags } from "./components/App";
import { setDefaultHooks } from "./events";
import { getItemCreators, getItemTags, _getItemCollections, _getItemRelated, _getItemType } from "./public";
import { registerSmartblockCommands } from "./smartblocks";
import { analyzeUserRequests, setupDependencies, setupPortals } from "./utils";
import { default_typemap } from "./variables";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "./index.css";

window.zoteroRoam = {};

(()=>{

	const extension = {
		version: "0.7.0",
		portalId: "zotero-roam-portal"
	};

	const extensionSlot = "zotero-roam-slot";
	setupPortals(extensionSlot, extension.portalId);

	let {
		autocomplete = {},
		autoload = false,
		copy = {},
		dataRequests = [],
		metadata = {},
		notes = {},
		pageMenu = {},
		render_inline = false,
		shortcuts = {},
		typemap = {},
		webimport = { tags: [] }
	} = window.zoteroRoam_settings;

	// Use object merging to handle undefined settings
	window.zoteroRoam.config = {
		userSettings: {
			autocomplete,
			autoload,
			copy: {
				always: false,
				defaultFormat: "citekey",
				overrideKey: "shiftKey",
				useQuickCopy: false,
				...copy
			},
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
			shortcuts: {
				"toggleDashboard": false,
				"toggleSearchPanel": "alt+E",
				"toggleQuickCopy": false,
				...shortcuts
			},
			typemap: {
				...default_typemap,
				...typemap
			},
			webimport
		}
	};

	window.zoteroRoam.getChildren = getChildren;
	window.zoteroRoam.getItems = getItems;

	try {
		const requests = analyzeUserRequests(dataRequests);
		window.zoteroRoam.config.requests = requests;

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

		setupDependencies([
			{ id: "scite-badge", src: "https://cdn.scite.ai/badge/scite-badge-latest.min.js"} // Scite.ai Badge
		]);
		setDefaultHooks();
		registerSmartblockCommands(getItems);

		ReactDOMRender(
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