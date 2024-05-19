import { version } from "../package.json";
import { ZoteroAPI } from "@clients/zotero";

/** @constant {String} The extension's current version (from package.json) */
export const EXTENSION_VERSION = version;

/** @constant {String} The HTML id for the extension's portals' container */
export const EXTENSION_PORTAL_ID = "zotero-roam-portal";
/** @constant {String} The HTML id for the extension's icon's container */
export const EXTENSION_SLOT_ID = "zotero-roam-slot";


/** @constant {Number} The default timeout (in ms) for toasts */
export const DEFAULT_TOAST_TIMEOUT = 1500;


/** @constant {String} The name for the extension's idb database */
export const IDB_DATABASE_NAME = "ZOTERO_ROAM";
/** @constant {Number} The current version for the extension's idb database */
export const IDB_DATABASE_VERSION = 1;
/** @constant {String} The name for the React Query store in the extension's idb database */
export const IDB_REACT_QUERY_STORE_NAME = "REACT_QUERY";
/** @constant {String} The key name for the client in the React Query store */
export const IDB_REACT_QUERY_CLIENT_KEY = "REACT_QUERY_CLIENT";


/* istanbul ignore file */
export const TYPEMAP_DEFAULT: Record<ZoteroAPI.ItemTop["data"]["itemType"], string> = {
	artwork: "Illustration",
	audioRecording: "Recording",
	bill: "Legislation",
	blogPost: "Blog post",
	book: "Book",
	bookSection: "Chapter",
	"case": "Legal case",
	computerProgram: "Data",
	conferencePaper: "Conference paper",
	dictionaryEntry: "Dictionary entry",
	document: "Document",
	email: "Letter",
	encyclopediaArticle: "Encyclopaedia article",
	film: "Film",
	forumPost: "Forum post",
	hearing: "Hearing",
	instantMessage: "Instant message",
	interview: "Interview",
	journalArticle: "Article",
	letter: "Letter",
	magazineArticle: "Magazine article",
	manuscript: "Manuscript",
	map: "Image",
	newspaperArticle: "Newspaper article",
	patent: "Patent",
	podcast: "Podcast",
	preprint: "Preprint",
	presentation: "Presentation",
	radioBroadcast: "Radio broadcast",
	report: "Report",
	statute: "Legislation",
	thesis: "Thesis",
	tvBroadcast: "TV broadcast",
	videoRecording: "Recording",
	webpage: "Webpage"
};


export const CustomClasses = {
	DATALIST_ITEM: "zr-datalist--item",
	DATALIST_PAGINATION: "zr-datalist--pagination",
	DATALIST_TOOLBAR: "zr-datalist--toolbar",
	DATALIST_WRAPPER: "zr-datalist--listwrapper",
	DATE_PICKER: "zr-date-picker",
	DIVIDER_MINIMAL: "zr-divider-minimal",
	INPUT_BOX: "zr-input-box",
	INPUT_DATE_RANGE: "zr-date-range-input",
	INPUT_TEXT: "zr-text-input",
	POPOVER: "zr-popover",
	PREFIX_DIALOG_AUXILIARY: "zr-auxiliary-dialog--",
	PREFIX_DIALOG_OVERLAY: "zr-dialog-overlay--",
	PREFIX_DRAWER: "zr-drawer--",
	TABS: "zr-tabs",
	TABS_MINIMAL: "zr-tabs-minimal",
	TEXT_ACCENT_1: "zr-accent-1",
	TEXT_ACCENT_2: "zr-accent-2",
	TEXT_AUXILIARY: "zr-auxiliary",
	TEXT_SECONDARY: "zr-secondary",
	TEXT_SMALL: "zr-text-small",
	TRIBUTE: "zr-tribute",
	TRIBUTE_SELECTED: "zr-tribute--selected",
	TRIBUTE_DETAILS: "zr-tribute--item-details"
};
