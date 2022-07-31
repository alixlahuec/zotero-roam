import * as Sentry from "@sentry/react";
import { unmountComponentAtNode } from "react-dom";


import {
	DEPENDENCIES_SCRIPTS,
	EXTENSION_PORTAL_ID,
	EXTENSION_SLOT_ID,
	TYPEMAP_DEFAULT
} from "./constants";


/** Generates a data requests configuration object
 * @param {Array} reqs - Data requests provided by the user
 * @returns {ConfigRequests} A configuration object for the extension to use
 */
export function analyzeUserRequests(reqs){
	if(reqs.length == 0){
		console.warn("At least one data request must be specified for the extension to function. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
		return {
			dataRequests: [],
			apiKeys: [],
			libraries: []
		};
	} else {
		const fallbackAPIKey = reqs.find(req => req.apikey)?.apikey;
		if(!fallbackAPIKey){
			throw new Error("At least one data request must be assigned an API key. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
		} else {
			const dataRequests = reqs.map((req, i) => {
				const { dataURI, apikey = fallbackAPIKey, params = "", name = `${i}` } = req;
				if(!dataURI){
					throw new Error("Each data request must be assigned a data URI. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
				} else {
					const library = dataURI.match(/(users|groups)\/(\d+?)(?=\/items)/g)?.[0];
					if(!library){
						throw new Error(`An incorrect data URI was provided for a request : ${dataURI}. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/prereqs#zotero-api-credentials`);
					} else {
						return { dataURI, apikey, params, name, library };
					}
				}
			});

			const apiKeys = Array.from(new Set(dataRequests.map(req => req.apikey)));
			const libraries = dataRequests.reduce((arr, req) => {
				const { library: path, apikey } = req;
				const has_lib = arr.find(lib => lib.path == path);
				if(!has_lib){
					arr.push({ path, apikey });
				}
				return arr;
			}, []);

			return {
				dataRequests,
				apiKeys,
				libraries
			};
		}
	}
}

export function setupInitialSettings(settingsObject){
	const {
		annotations = {},
		autocomplete = {},
		autoload = false,
		copy = {},
		darkTheme = false,
		// dataRequests = [],
		metadata = {},
		notes = {},
		pageMenu = {},
		render_inline = false,
        // requests = { dataRequests: [], apiKeys: [], libraries: []}
		sciteBadge = {},
		shareErrors = false,
		shortcuts = {},
		typemap = {},
		webimport = {}
	} = settingsObject;
	
	return {
		annotations: {
			comment_prefix: "",
			comment_suffix: "",
			func: null,
			group_by: false,
			highlight_prefix: "[[>]]",
			highlight_suffix: "([p. {{page_label}}]({{link_page}})) {{tags_string}}",
			use: "formatted",
			...annotations
		},
		autoload,
		autocomplete: {
			display: "citekey",
			format: "citation",
			trigger: null,
			...autocomplete
		},
		copy: {
			always: false,
			defaultFormat: "citekey",
			overrideKey: "shiftKey",
			useQuickCopy: false,
			...copy
		},
		darkTheme,
		metadata: {
			func: null,
			smartblock: {
				param: "srcUid",
				paramValue: ""
			},
			use: "function",
			...metadata
		},
		notes: {
			func: null,
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
			...TYPEMAP_DEFAULT,
			...typemap
		},
		webimport: {
			tags: [],
			...webimport
		}
	};
}

/* istanbul ignore next */
async function configRoamDepot({ extensionAPI }){
	const current = extensionAPI.settings.getAll();
	const settings = setupInitialSettings(Object.fromEntries(current || new Map()));

	const setterCalls = [];
	Object.entries(settings).forEach(([key, val]) => {
		setterCalls.push(extensionAPI.settings.set(key, val));
	});

	await Promise.all(setterCalls);

	let requests = extensionAPI.settings.get("requests");
	if(!requests){
		requests = {
			dataRequests: [],
			apiKeys: [],
			libraries: []
		};
		await extensionAPI.settings.set("requests", requests);
	}

	return {
		requests,
		settings
	};
}

/* istanbul ignore next */
function configRoamJS({ manualSettings }){
	const { dataRequests } = manualSettings;

	const settings = setupInitialSettings(manualSettings);

	const requests = analyzeUserRequests(dataRequests);

	return {
		requests,
		settings
	};
}

/* istanbul ignore next */
function setupPublicAPI({ requests, settings, utils }){
	const { getBibEntries, getBibliography, getCollections, _getItemCollections, _getItemMetadata, _getItemType, getTags } = utils;

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

	window.zoteroRoam.getItemMetadata = (item, pdfs, notes) => _getItemMetadata(item, pdfs, notes, settings.typemap, settings.notes, settings.annotations);

	window.zoteroRoam.getItemType = (item, { brackets = true } = {}) => _getItemType(item, settings.typemap, { brackets });

	window.zoteroRoam.getTags = (location) => {
		let { libraries } = requests;
		let library = libraries.find(lib => lib.path == location);
    
		return getTags(library);
	};
}

/* istanbul ignore next */
export async function initialize(setup = "roam/js", { extensionAPI, manualSettings, utils } = {}){
	const { requests, settings } = setup == "roam/js"
		? configRoamJS({ manualSettings })
		: await configRoamDepot({ extensionAPI });

    // TODO: for Roam Depot, make the utils reactive to changes in any of their dependencies (via context?)
	setupPublicAPI({ requests, settings, utils });

}

/* istanbul ignore next */
/** Sets up the extension's theme (light vs dark)
 * @param {Boolean} use_dark - If the extension's theme should be `dark`
 */
export function setupDarkTheme(use_dark = false){
	document.getElementsByTagName("body")[0].setAttribute("zr-dark-theme", (use_dark == true).toString());
}

/* istanbul ignore next */
/** Injects external scripts into the page
 */
export function setupDependencies(){
	DEPENDENCIES_SCRIPTS.forEach(dep => {
		const { id, src } = dep;
		try { 
			document.getElementById(id).remove(); 
		} catch(e){
			// Do nothing
		}
		const script = document.createElement("script");
		script.src = src;
		script.type = "application/javascript";
		script.async = true;
		document.getElementsByTagName("head")[0].appendChild(script);
	});
}

/* istanbul ignore next */
/** Injects DOM elements to be used as React portals by the extension */
export function setupPortals(){

	unmountExtensionIfExists();

	const roamSearchbar = document.querySelector(".rm-topbar .rm-find-or-create-wrapper");
	const extensionSlot = document.createElement("span");
	extensionSlot.id = EXTENSION_SLOT_ID;
	roamSearchbar.insertAdjacentElement("afterend", extensionSlot);

	const zrPortal = document.createElement("div");
	zrPortal.id = EXTENSION_PORTAL_ID;
	document.getElementById("app").appendChild(zrPortal);
}

/* istanbul ignore next */
export function setupSentry(isUserEnabled = false, config = {}){
	// https://github.com/getsentry/sentry-javascript/issues/2039
	if(isUserEnabled){
		Sentry.getCurrentHub().getClient().getOptions().enabled = true;
		Sentry.setContext("config", config);
	} else {
		Sentry.getCurrentHub().getClient().getOptions().enabled = false;
	}
}

/* istanbul ignore next */
export function unmountExtensionIfExists(){
	const existingSlot = document.getElementById(EXTENSION_SLOT_ID);
	if(existingSlot){
		try{
			unmountComponentAtNode(existingSlot);
			existingSlot.remove();
		} catch(e){
			console.error(e);
		}
	}

	// Portal for the extension's overlays
	try{ 
		document.getElementById(EXTENSION_PORTAL_ID).remove(); 
	} catch(e){
		// Do nothing
	}
}
