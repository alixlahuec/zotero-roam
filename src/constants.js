import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";


/** @constant {String} The extension's current version (from package.json) */
export const EXTENSION_VERSION = require("../package.json").version;

/** @constant {String} The HTML id for the extension's portals' container */
export const EXTENSION_PORTAL_ID = "zotero-roam-portal";
/** @constant {String} The HTML id for the extension's icon's container */
export const EXTENSION_SLOT_ID = "zotero-roam-slot";

export const SENTRY_CONFIG = {
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
	integrations: [
		new BrowserTracing(), 
		new Sentry.Integrations.GlobalHandlers({
			onunhandledrejection: false
		})
	],
  
	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 0.8
};

/* istanbul ignore file */
export const TYPEMAP_DEFAULT = {
	artwork: "Illustration",
	audioRecording: "Recording",
	bill: "Legislation",
	blogPost: "Blog post",
	book: "Book",
	bookSection: "Chapter",
	"case": "Legal case",
	computerProgram: "Data",
	conferencePaper: "Conference paper",
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
	DATE_INPUT: "zr-date-input",
	DATE_INPUT_RANGE: "zr-date-range-input",
	DATE_PICKER: "zr-date-picker",
	DIVIDER_MINIMAL: "zr-divider-minimal",
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
