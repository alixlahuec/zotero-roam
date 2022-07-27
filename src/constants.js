export const EXTENSION_VERSION = "0.7.0";

export const EXTENSION_PORTAL_ID = "zotero-roam-portal";
export const EXTENSION_SLOT_ID = "zotero-roam-slot";

export const DEPENDENCIES_SCRIPTS = [
	{ id: "scite-badge", src: "https://cdn.scite.ai/badge/scite-badge-latest.min.js"}
];

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
