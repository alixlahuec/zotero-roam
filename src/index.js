import React from "react";
import { render as ReactDOMRender } from "react-dom";
import { analyzeUserRequests, setupDependencies, setupPortals } from "./utils";
import { Toast } from "@blueprintjs/core";
import { App, getChildren, getItems } from "./components/App";
import { registerSmartblockCommands } from "./smartblocks";

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
		dataRequests = [],
		autocomplete = {},
		autoload = false,
		copy = {},
		render_inline = false
	} = window.zoteroRoam_settings;

	window.zoteroRoam.config = {
		userSettings: {
			autocomplete,
			autoload,
			copy: {
				always: false,
				defaultFormat: "citekey",
				overrideKey: "shiftKey",
				useQuickCopy: false,
				...copy // Use object merging to handle undefined settings
			},
			render_inline
		}
	};

	window.zoteroRoam.getChildren = getChildren;
	window.zoteroRoam.getItems = getItems;

	try {
		window.zoteroRoam.config.requests = analyzeUserRequests(dataRequests);
		setupDependencies([
			{ id: "scite-badge", src: "https://cdn.scite.ai/badge/scite-badge-latest.min.js"} // Scite.ai Badge
		]);
		registerSmartblockCommands();

		ReactDOMRender(
			<App
				extension={extension}
				{...window.zoteroRoam.config.requests}
				userSettings={window.zoteroRoam.config.userSettings}
			/>,
			document.getElementById(extensionSlot)
		);
	} catch (e) {
		console.error(e);
		ReactDOMRender(
			<Toast intent="danger" message={e.message} />
		);
	}

})();