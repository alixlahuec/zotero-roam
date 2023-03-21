import { unmountComponentAtNode } from "react-dom";

import { parseKeyCombo } from "@blueprintjs/core";
import { defaultShouldDehydrateQuery } from "@tanstack/react-query";

import { cleanErrorIfAxios } from "./utils";
import { registerSmartblockCommands } from "./smartblocks";
import { setDefaultHooks } from "./events";

import {
	EXTENSION_PORTAL_ID,
	EXTENSION_SLOT_ID,
	IDB_REACT_QUERY_CLIENT_KEY,
	IDB_REACT_QUERY_STORE_NAME,
	TYPEMAP_DEFAULT
} from "./constants";


/** Generates a data requests configuration object
 * @param {LegacyDataRequest|LegacyDataRequest[]|DataRequest[]} requests - Data requests provided by the user
 * @returns {UserRequests} A configuration object for the extension to use
 */
export function analyzeUserRequests(requests){
	const reqs = (requests.constructor === Array)
		? requests
		: [requests];

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
			const dataRequests = reqs.map((req) => {
				const { apikey, dataURI, library, name = "" } = req;
				if(library){
					const { id, type } = library;
                    
					if(!id || isNaN(id)){
						throw new Error("A library ID is missing or invalid. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
					}

					if(!type || !["users", "groups"].includes(type)){
						throw new Error("A library type is missing or invalid. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
					}

					return {
						apikey: apikey || fallbackAPIKey,
						dataURI: [type, id, "items"].join("/"),
						library: {
							id,
							path: [type, id].join("/"),
							type,
							uri: "items"
						},
						name
					};
				} else {

					if(!dataURI){
						throw new Error("Each data request must be assigned a data URI. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
					}
                    
					const match = [...dataURI.matchAll(/(users|groups)\/(\d+?)\/(items.*)/g)];
					
					if(match.length == 0){
						throw new Error(`An incorrect data URI was provided for a request : ${dataURI}. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/prereqs#zotero-api-credentials`);
					} 
                    
					const [/*input*/, type, id, uri] = match[0];
					return { 
						apikey: apikey || fallbackAPIKey, 
						dataURI, 
						library: {
							id,
							path: [type, id].join("/"),
							type,
							uri
						}, 
						name 
					};
				}
			});

			const apiKeys = Array.from(new Set(dataRequests.map(req => req.apikey))).filter(Boolean);
			const libraries = dataRequests.reduce((arr, req) => {
				const { library: { path }, apikey } = req;
				const has_lib = arr.find(lib => lib.path == path);

				if(has_lib){
					throw new Error(`The same library was provided twice: ${path}.`);
				}
				
				arr.push({ path, apikey });
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

/* istanbul ignore next */
/** Creates a persister that can be used for writing a React Query client to the IndexedDB cache.
 * @param {IDBDatabase} database - The targeted IDBDatabase
 * @returns 
 */
export function createPersisterWithIDB(database){
	const indexedDbKey = IDB_REACT_QUERY_CLIENT_KEY;
	const reactQueryStore = database.selectStore(IDB_REACT_QUERY_STORE_NAME);

	return {
		persistClient: async (client) => {
			try {
				return await reactQueryStore.set(indexedDbKey, client);
			} catch(e) {
				window.zoteroRoam?.error?.({
					origin: "Database",
					message: "Failed to persist query client",
					context: {
						error: cleanErrorIfAxios(e)
					}
				});
				throw e;
			}
		},
		removeClient: async () => {
			try {
				return await reactQueryStore.delete(indexedDbKey);
			} catch (e) {
				window.zoteroRoam?.error?.({
					origin: "Database",
					message: "Failed to remove query client",
					context: {
						error: cleanErrorIfAxios(e)
					}
				});
				throw e;
			}
		},
		restoreClient: async () => {
			try {
				return await reactQueryStore.get(indexedDbKey);
			} catch (e) {
				window.zoteroRoam?.error?.({
					origin: "Database",
					message: "Failed to restore query client",
					context: {
						error: cleanErrorIfAxios(e)
					}
				});
				throw e;
			}
		}
	};
}

/** Conducts checks on a query to determine if it should be persisted
 * @param {QueryKey} query - The targeted React Query query
 * @returns 
 */
export function shouldQueryBePersisted(query){
	const { queryKey } = query;

	if(queryKey.includes("permissions") || queryKey[0] == "permissions"){
		return false;
	}

	return defaultShouldDehydrateQuery(query);
}

/** Generates a merged settings object, combining user settings and defaults.
 * @param {Partial<UserSettings>} settingsObject - The user's settings object
 * @returns The merged object
 */
export function setupInitialSettings(settingsObject){
	const {
		annotations = {},
		autocomplete = {},
		copy = {},
		// dataRequests = [],
		metadata = {},
		notes = {},
		other = {},
		pageMenu = {},
		// requests = { dataRequests: [], apiKeys: [], libraries: []}
		sciteBadge = {},
		shortcuts = {},
		typemap = {},
		webimport = {}
	} = settingsObject;
	
	return {
		annotations: {
			func: "",
			group_by: false,
			template_comment: "{{comment}}",
			template_highlight: "[[>]] {{highlight}} ([p. {{page_label}}]({{link_page}})) {{tags_string}}",
			use: "default",
			__with: "formatted",
			...annotations
		},
		autocomplete: {
			display_char: "",
			display_use: "preset",
			// legacy - should be display_preset
			display: "citekey",
			format_char: "",
			format_use: "preset",
			// legacy - should be format_preset
			format: "citation",
			trigger: "",
			...autocomplete
		},
		copy: {
			always: false,
			overrideKey: "shiftKey",
			preset: "citekey",
			template: "@{{key}}",
			useAsDefault: "preset",
			useQuickCopy: false,
			...copy
		},
		metadata: {
			func: "",
			smartblock: {
				param: "srcUid",
				paramValue: ""
			},
			use: "default",
			...metadata
		},
		notes: {
			func: "",
			nest_char: "",
			nest_position: "top",
			nest_preset: "[[Notes]]",
			nest_use: "preset",
			split_char: "",
			split_preset: "\n",
			split_use: "preset",
			use: "default",
			__with: "text",
			...notes
		},
		other: {
			autoload: false,
			cacheEnabled: false,
			darkTheme: false,
			render_inline: false,
			...other
		},
		pageMenu: {
			defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"],
			trigger: "default",
			...pageMenu
		},
		sciteBadge: {
			layout: "horizontal",
			showLabels: false,
			showZero: true,
			small: false,
			tooltipPlacement: "auto",
			tooltipSlide: 0,
			...sciteBadge
		},
		shortcuts: {
			"copyDefault": "",
			"copyCitation": "",
			"copyCitekey": "",
			"copyPageRef": "",
			"copyTag": "",
			"focusSearchBar": "",
			"goToItemPage": "",
			"importMetadata": "",
			"toggleDashboard": "",
			"toggleNotes": "alt+N",
			"toggleSearchPanel": "alt+E",
			"toggleSettingsPanel": "",
			"toggleQuickCopy": "",
			...(validateShortcuts(shortcuts))
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
/** Initializes the extension, from a Roam Depot install
 * @param {{extensionAPI: Roam.ExtensionAPI}} config - The install parameters 
 * @returns The user's setup configuration
 */
function configRoamDepot({ extensionAPI }){
	const current = extensionAPI.settings.getAll();
	const settings = setupInitialSettings(current || {});

	Object.entries(settings).forEach(([key, val]) => {
		extensionAPI.settings.set(key, val);
	});

	let requests = extensionAPI.settings.get("requests");
	if(!requests){
		requests = {
			dataRequests: [],
			apiKeys: [],
			libraries: []
		};
		extensionAPI.settings.set("requests", requests);
	}

	return {
		requests,
		settings
	};
}

/* istanbul ignore next */
/** Initializes the extension, from a roam/js install
 * @param {{manualSettings: UserSettings}} config - The install parameters 
 * @returns The user's setup configuration
 */
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
/** Initializes the extension, given an installation environment and parameters
 * @param {("roam/depot"|"roam/js"|"sandbox")} context - The install environment
 * @param {{extensionAPI?: Roam.ExtensionAPI, manualSettings?: Object}} config - The install parameters 
 * @returns 
 */
export function initialize(context = "roam/js", { extensionAPI, manualSettings }){
	const { requests, settings } = (context == "roam/depot")
		? configRoamDepot({ extensionAPI })
		: configRoamJS({ manualSettings });
    
	return { requests, settings };
}

/* istanbul ignore next */
/** Sets up the extension's theme (light vs dark)
 * @param {Boolean} use_dark - If the extension's theme should be `dark`
 */
function setupDarkTheme(use_dark = false){
	document.getElementsByTagName("body")[0].setAttribute("zr-dark-theme", (use_dark == true).toString());
}

/* istanbul ignore next */
/** Injects DOM elements to be used as React portals by the extension */
export function setupPortals(){

	unmountExtensionIfExists();

	const roamSearchbar = document.querySelector(".rm-topbar .rm-find-or-create-wrapper");
	const extensionSlot = document.createElement("span");
	extensionSlot.id = EXTENSION_SLOT_ID;
	roamSearchbar?.insertAdjacentElement("afterend", extensionSlot);

	const zrPortal = document.createElement("div");
	zrPortal.id = EXTENSION_PORTAL_ID;
	document.getElementById("app")?.appendChild(zrPortal);
}

/* istanbul ignore next */
/** Sets up secondary functions that are needed by the extension
 * @param {{settings: UserSettings}} config - The user's current settings
 */
export function setup({ settings }){
	setupDarkTheme(settings.other.darkTheme);
	setDefaultHooks();
	registerSmartblockCommands();
}

/* istanbul ignore next */
/** Teardown the extension's React tree, if it currently exists */
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
	document.getElementById(EXTENSION_PORTAL_ID)?.remove(); 

}

export function validateShortcuts(shortcuts){
	const output = {};

	Object.keys(shortcuts).forEach((key) => {
		const combo = shortcuts[key];
		if(combo == ""){
			output[key] = combo;
		} else {
			try {
				parseKeyCombo(shortcuts[key]);
				output[key] = shortcuts[key];
			} catch(e) {
				window.zoteroRoam?.warn?.({
					origin: "Shortcuts",
					message: "Invalid hotkey: " + shortcuts[key]
				});
			}
		}
	});

	return output;
}
