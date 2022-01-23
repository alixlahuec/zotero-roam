import React from "react";
import { render as ReactDOMRender } from "react-dom";
import { HotkeysProvider } from "@blueprintjs/core";

import { App, getChildren, getItems } from "./components/App";
import { setDefaultHooks } from "./events";
import { registerSmartblockCommands } from "./smartblocks";
import zrToaster from "./toaster";
import { analyzeUserRequests, setupDependencies, setupPortals } from "./utils";

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
		metadata = {},
		render_inline = false,
		shortcuts = {}
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
			render_inline,
			shortcuts: {
				"toggleSearchPanel": "alt+E",
				"toggleQuickCopy": false,
				...shortcuts
			}
		}
	};

	window.zoteroRoam.getChildren = getChildren;
	window.zoteroRoam.getItems = getItems;

	try {
		window.zoteroRoam.config.requests = analyzeUserRequests(dataRequests);
		setupDependencies([
			{ id: "scite-badge", src: "https://cdn.scite.ai/badge/scite-badge-latest.min.js"} // Scite.ai Badge
		]);
		setDefaultHooks();
		registerSmartblockCommands(getItems);

		ReactDOMRender(
			<HotkeysProvider dialogProps={{globalGroupName: "zoteroRoam"}}>
				<App
					extension={extension}
					{...window.zoteroRoam.config.requests}
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