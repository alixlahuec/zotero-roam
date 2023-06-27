import { unmountComponentAtNode } from "react-dom";
import { parseKeyCombo } from "@blueprintjs/core";
import { Query, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { PersistedClient } from "@tanstack/react-query-persist-client";

import { cleanErrorIfAxios } from "./api/utils";
import IDBDatabase from "./services/idb";
import { registerSmartblockCommands } from "./smartblocks";
import { setDefaultHooks } from "./events";

import {
	EXTENSION_PORTAL_ID,
	EXTENSION_SLOT_ID,
	IDB_REACT_QUERY_CLIENT_KEY,
	IDB_REACT_QUERY_STORE_NAME,
	TYPEMAP_DEFAULT
} from "./constants";

import { DataRequest, LegacyUserDataRequest, LegacyUserSettings, SettingsShortcuts, UserDataRequest, UserRequests, UserSettings } from "Types/extension";
import { ZLibrary } from "Types/transforms";
import { Roam } from "Types/externals";


type InstallArgs =
	| { context: "roam/depot", extensionAPI: Roam.ExtensionAPI }
	| {
		context: "roam/js" | "sandbox",
		manualSettings: LegacyUserSettings
	}

/** Generates a data requests configuration object */
export function analyzeUserRequests(requests: LegacyUserDataRequest|(LegacyUserDataRequest|UserDataRequest)[]): UserRequests{
	const reqs = (Array.isArray(requests))
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
				if ("library" in req) {
					const { apikey, library, name = "" } = req;
					const { id, type } = library;
                    
					if(!id || isNaN(Number(id))){
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
					const { apikey, dataURI, name = "" } = req;

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
							type: type as DataRequest["library"]["type"],
							uri
						}, 
						name 
					};
				}
			});

			const apiKeys = Array.from(new Set(dataRequests.map(req => req.apikey)));
			const libraries = dataRequests.reduce<ZLibrary[]>((arr, req) => {
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
/** Creates a persister that can be used for writing a React Query client to the IndexedDB cache. */
export function createPersisterWithIDB(database: IDBDatabase){
	const indexedDbKey = IDB_REACT_QUERY_CLIENT_KEY;
	const reactQueryStore = database.selectStore(IDB_REACT_QUERY_STORE_NAME);

	return {
		persistClient: async (client: PersistedClient) => {
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

/** Conducts checks on a React Query query to determine if it should be persisted */
export function shouldQueryBePersisted(query: Query){
	const { queryKey } = query;

	if(queryKey.includes("permissions") || queryKey[0] == "permissions"){
		return false;
	}

	return defaultShouldDehydrateQuery(query);
}

/** Generates a merged settings object, combining user settings and defaults. */
export function setupInitialSettings(settingsObject: Partial<UserSettings>): UserSettings{
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
 * @returns The user's setup configuration
 */
function configRoamDepot({ extensionAPI }: { extensionAPI: Roam.ExtensionAPI }){
	const current = extensionAPI.settings.getAll();
	const settings = setupInitialSettings(current || {});

	Object.entries(settings).forEach(([key, val]) => {
		extensionAPI.settings.set(key, val);
	});

	let requests = extensionAPI.settings.get<UserRequests>("requests");
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
 * @returns The user's setup configuration
 */
function configRoamJS({ manualSettings }: { manualSettings: LegacyUserSettings }){
	const { dataRequests = [] } = manualSettings;

	const settings = setupInitialSettings(manualSettings);

	const requests = analyzeUserRequests(dataRequests);

	return {
		requests,
		settings
	};
}

/* istanbul ignore next */
/** Initializes the extension, given an installation environment and parameters */
export function initialize(configObj: InstallArgs) {
	const { requests, settings } = (configObj.context == "roam/depot")
		? configRoamDepot(configObj)
		: configRoamJS(configObj);
    
	return { requests, settings };
}

/* istanbul ignore next */
/** Sets up the extension's theme (light vs dark)
 * @param use_dark - If the extension's theme should be `dark`
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
 * @param config - The user's current settings
 */
export function setup({ settings }: { settings: UserSettings }){
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

export function validateShortcuts(shortcuts: SettingsShortcuts): SettingsShortcuts{
	const output: SettingsShortcuts = {};

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
