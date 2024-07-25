import { ZoteroAPI } from "@clients/zotero";
import { SBConfig } from "@services/smartblocks";

import { ZLibrary } from "../transforms";
import { ZItemReferenceFormat } from "./misc";


/* -------------------------------------------------------------- */

/**
 * Legacy format for data requests. Should be assumed to be used by all users loading the extension via `roam/js`.
 */
export interface LegacyUserDataRequest {
	/** The API key to be used */
	apikey?: string,
	/** The data URI to be used
	 * @example "users/123456/items"
	*/
	dataURI: string,
	/** A user-chosen name for the request */
	name?: string,
	/** Additional parameters for the request */
	params?: string
}

export interface UserDataRequest {
	apikey?: string,
	library: {
		id: string,
		type: "groups" | "users"
	},
	name?: string
}

/** 
 * Parameters for making a request for items to the Zotero API
*/
export interface DataRequest {
	/** The API key to be used */
	apikey: string,
	/** The data URI to be used
	 * @example "users/123456/items"
	*/
	dataURI: string,
	/** The targeted library */
	library: {
		/** The library ID
		 * @example "123456"
		*/
		id: string,
		/** The library's path
		 * @example "users/123456"
		 */
		path: string,
		/** The library's type */
		type: "groups" | "users",
		/** The targeted URI within the library
		 * @example "items"
		 */
		uri: string
	},
	/** A user-chosen name for the request */
	name: string
}

/** 
 * The user's requests settings
*/
export interface UserRequests {
	/** The list of unique API keys used in the user's requests */
	apiKeys: string[],
	/** The user's requests */
	dataRequests: DataRequest[],
	/** The list of unique libraries used in the user's requests */
	libraries: ZLibrary[]
}

/* -------------------------------------------------------------- */

/** Settings to use for formatting Zotero 6 annotations */
export interface SettingsAnnotations {
	/** The name of the custom formatting function */
	func: string,
	/** The grouping method to use for annotations: `false` if no grouping, or a preset value */
	group_by: "day_added" | false,
	/** The template to use for comments */
	template_comment: string,
	/** The template to use for highlights */
	template_highlight: string,
	/** The type of formatter to use for annotations */
	use: "default" | "function",
	/** The input type that should be passed to the custom formatting function */
	__with: "formatted" | "raw"
}

/** Settings for the Autocomplete feature */
export interface SettingsAutocomplete {
	/** The preset to use to show suggestions */
	display: ZItemReferenceFormat,
	/** The custom template to use to show suggestions */
	display_char: string,
	/** The type of formatter to use to show suggestions */
	display_use: "preset" | "custom",
	/** The preset to use to insert suggestions */
	format: ZItemReferenceFormat,
	/** The custom template to use to insert suggestions */
	format_char: string,
	/** The type of formatter to use to show suggestions */
	format_use: "preset" | "custom",
	/** The string used to show the autocomplete menu */
	trigger: string
}

/** Settings to use for copying item references */
export interface SettingsCopy {
	/** Determines if item references should always be copied, when selected in Library Search */
	always: boolean,
	/** The key to press to override the QuickCopy setting */
	overrideKey: "altKey" | "ctrlKey" | "metaKey" | "shiftKey",
	/** The preset to use to copy item references */
	preset: "citation" | "citekey" | "page-reference" | "raw" | "tag",
	/** The custom template to use to copy item references */
	template: string,
	/** The type of formatter to use to copy item references */
	useAsDefault: "preset" | "template",
	/** Determines if QuickCopy should be enabled by default */
	useQuickCopy: boolean
}

/** Settings to use for formatting item metadata */
export interface SettingsMetadata {
	/** The name of the custom formatting function */
	func: string,
	/** The configuration of the custom formatting SmartBlock */
	smartblock: SBConfig,
	/** The type of formatter to use for metadata */
	use: "default" | "function" | "smartblock"
}

/** Settings to use for formatting Zotero notes */
export interface SettingsNotes {
	/** The name of the custom formatting function */
	func: string,
	/** The string under which blocks should be nested */
	nest_char: string,
	/** The position where blocks should be nested */
	nest_position: "top" | "bottom",
	/** The default value for nesting: `false` if no nesting, or the preset value */
	nest_preset: false | "[[Notes]]",
	/** The type of setting to use for nesting */
	nest_use: "preset" | "custom",
	/** The string on which blocks should be split */
	split_char: string,
	/** The default string for splitting blocks */
	split_preset: "\n" | "</p>",
	/** The type of setting to use for splitting blocks */
	split_use: "preset" | "custom",
	/** The type of formatter to use for notes */
	use: "default" | "function",
	/** The input type that should be passed to the custom formatting function */
	__with: "raw" | "text"
}

/** Settings for miscellaneous features */
export interface SettingsOther {
	/** Determines if the extension should automatically be activated on load */
	autoload: boolean,
	/** Determines if the extension should use local cache to persist data */
	cacheEnabled: boolean,
	/** Determines if the extension should use Dark Mode by default */
	darkTheme: boolean,
	/** Determines if the extension should render inline citekeys as references */
	render_inline: boolean
}

/** Settings for displaying page menus */
export interface SettingsPageMenu {
	/** The list of elements to display in citekey menus */
	defaults: ("addMetadata" | "importNotes" | "viewItemInfo" | "openZoteroLocal" | "openZoteroWeb" | "pdfLinks" | "sciteBadge" | "connectedPapers" | "semanticScholar" | "googleScholar" | "citingPapers")[],
	/** Determines when page menus should be shown: "default" if the preset should be used, or a boolean value */
	trigger: "default" | boolean
}

/** Settings for displaying Scite badges */
export interface SettingsSciteBadge {
	/** The layout direction for the badge */
	layout: "horizontal" | "vertical",
	/** Determines if category labels should be shown */
	showLabels: boolean,
	/** Determines if categories without results should be shown */
	showZero: boolean,
	/** Determines if smaller styling should be used for the badge */
	small: boolean,
	/** Determines the direction for the tooltip */
	tooltipPlacement: "auto" | "top" | "left" | "right" | "bottom",
	/** Determines the offset for the tooltip */
	tooltipSlide: number
}

/** The keyboard shortcuts to be used with the extension */
export type SettingsShortcuts = Record<string, string>;

/** The typemap to be used for mapping Zotero item types & display names */
export type SettingsTypemap = Record<ZoteroAPI.ItemTop["data"]["itemType"],string>;

/** Settings for the WebImport feature */
export interface SettingsWebImport {
	tags: string[]
}

/** 
 * The user's interface settings
*/
export interface UserSettings {
	annotations: SettingsAnnotations,
	autocomplete: SettingsAutocomplete,
	copy: SettingsCopy,
	metadata: SettingsMetadata,
	notes: SettingsNotes,
	other: SettingsOther,
	pageMenu: SettingsPageMenu,
	sciteBadge: SettingsSciteBadge,
	shortcuts: SettingsShortcuts,
	typemap: SettingsTypemap,
	webimport: SettingsWebImport
}

/* -------------------------------------------------------------- */

/** 
 * The user's full settings
*/
export type InitSettings = {
	requests: UserRequests
} & UserSettings;

export type LegacyUserSettings = {
	dataRequests: (LegacyUserDataRequest | UserDataRequest)[]
} & Partial<UserSettings>
