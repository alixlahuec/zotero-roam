import React from "react";
import { render as ReactDOMRender } from "react-dom";
import { analyzeUserRequests, setupDependencies, setupPortals } from "./utils";
import { Toast } from "@blueprintjs/core";
import { App, getItems } from "./components/App";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import "./index.css";

var zoteroRoam = {};

(()=>{

	const version = "0.7.0";
	const extensionSlot = "zotero-roam-slot";
	const extensionPortal = "zotero-roam-portal";
    
	setupPortals(extensionSlot, extensionPortal);

	let {
		dataRequests = [],
		autocomplete = {},
		autoload = false
	} = window.zoteroRoam_settings;

	zoteroRoam.config = {
		userSettings: {
			autocomplete,
			autoload
		}
	};

	zoteroRoam.getItems = getItems;

	try {
		zoteroRoam.config.requests = analyzeUserRequests(dataRequests);
		setupDependencies([
			{ id: "scite-badge", src: "https://cdn.scite.ai/badge/scite-badge-latest.min.js"} // Scite.ai Badge
		]);

		ReactDOMRender(
			<App
				extension={{ version, extensionPortal }}
				{...zoteroRoam.config.requests}
				userSettings={zoteroRoam.config.userSettings}
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