import { arrayOf, bool, func, instanceOf, number, object, objectOf, oneOf, oneOfType, shape, string } from "prop-types";

const zoteroCollectionType = shape({
	data: object,
	key: string,
	library: object,
	links: object,
	meta: object,
	version: number
});

const zoteroItemType = shape({
	data: object,
	has_citekey: bool,
	key: string,
	library: object,
	links: object,
	meta: object,
	version: number
});

const zoteroLibraryType = shape({
	apikey: string,
	path: string
});

const zoteroTagType = shape({
	links: object,
	meta: shape({
		numItems: number,
		type: oneOf([0,1])
	}),
	tag: string
});

/**
 * @see matchTagData
 */

const taglistEntry = shape({
	roam: arrayOf(shape({ title: string, uid: string })),
	token: string,
	zotero: arrayOf(zoteroTagType)
});

/**
 * @see simplifyZoteroAnnotations
 */
const cleanAnnotationItemType = shape({
	color: string,
	comment: string,
	dateAdded: string,
	dateModified: string,
	key: string,
	library: string,
	link_pdf: string,
	link_page: string,
	pageLabel: string,
	parentItem: string,
	position: object,
	raw: object,
	sortIndex: arrayOf(number),
	tags: arrayOf(string),
	text: oneOfType([string, oneOf([null])]),
	type: oneOf(["highlight", "image"])
});

/**
 * @see cleanLibraryItem
 */
const cleanLibraryItemType = shape({
	abstract: string,
	authors: string,
	authorsFull: arrayOf(string),
	authorsLastNames: arrayOf(string),
	authorsRoles: arrayOf(string),
	children: shape({
		pdfs: arrayOf(zoteroItemType),
		notes: arrayOf(oneOfType([zoteroItemType, object])),
	}),
	createdByUser: oneOfType([string, oneOf([null])]),
	inGraph: oneOfType([string, oneOf([false])]),
	itemKey: string,
	itemType: string,
	key: string,
	location: string,
	meta: string,
	publication: string,
	tags: arrayOf(string),
	title: string,
	weblink: oneOfType([shape({ href: string, title: string }), oneOf([false])]),
	year: string,
	zotero: shape({
		local: string,
		web: string
	}),
	_multiField: string,
	raw: zoteroItemType
});
const cleanLibraryReturnArrayType = arrayOf(cleanLibraryItemType);

/**
 * @see cleanLibraryPDF
 */
const cleanLibraryPDFType = shape({
	annotations: arrayOf(object),
	key: string,
	link: string,
	parent: zoteroItemType,
	title: string,
	raw: zoteroItemType
});

/**
 * @see simplifyZoteroNotes
 */
const cleanNoteItemType = shape({
	dateAdded: string,
	dateModified: string,
	key: string,
	library: string,
	link_note: string,
	note: string,
	parentItem: string,
	raw: zoteroItemType,
	tags: arrayOf(string)
});

/**
 * @see makeLogFromItems
 */
const cleanRecentItemType = shape({
	abstract: string,
	children: shape({
		pdfs: arrayOf(zoteroItemType),
		notes: arrayOf(zoteroItemType)
	}),
	edited: instanceOf(Date),
	inGraph: oneOfType([string, oneOf([false])]),
	itemType: string,
	key: string,
	location: string,
	meta: string,
	publication: string,
	raw: zoteroItemType,
	title: string
});

/**
 * @see cleanRelatedItem
 */
const cleanRelatedItemType = shape({
	abstract: string,
	added: string,
	children: shape({
		pdfs: arrayOf(zoteroItemType),
		notes: arrayOf(zoteroItemType)
	}),
	inGraph: oneOfType([string, oneOf([false])]),
	itemType: string,
	key: string,
	location: string,
	meta: string,
	raw: zoteroItemType,
	timestamp: string,
	title: string
});

/**
 * @see cleanSemanticItem
 */
const cleanSemanticItem = {
	authors: string,
	authorsLastNames: string,
	authorsString: string,
	doi: oneOfType([string, oneOf([false])]),
	intent: arrayOf(string),
	isInfluential: bool,
	links: object,
	meta: string,
	title: string,
	url: string,
	year: string,
	_multiField: string
};

/**
 * @see cleanSemanticMatch
 */
const cleanSemanticReturnType = shape({
	...cleanSemanticItem,
	inGraph: oneOfType([string, oneOf([false])]),
	inLibrary: oneOfType([
		shape({
			children: {
				pdfs: arrayOf(zoteroItemType),
				notes: arrayOf(zoteroItemType)
			},
			raw: zoteroItemType
		}),
		oneOf([false])
	]),
	_type: oneOf(["cited", "citing"])
});

/**
 * @see cleanSemantic
 */
const cleanSemanticReturnObjectType = shape({
	backlinks: arrayOf(cleanSemanticReturnType),
	citations: arrayOf(cleanSemanticReturnType),
	references: arrayOf(cleanSemanticReturnType),
});

/**
 * USER SETTINGS
 */

const extensionType = shape({
	portalId: string,
	version: string
});

const annotationsSettingsType = shape({
	comment_prefix: string,
	comment_suffix: string,
	func: string,
	group_by: oneOf(["day_added", false]),
	highlight_prefix: string,
	highlight_suffix: string,
	use: oneOf(["formatted", "raw"])
});

const autocompleteSettingsType = shape({
	trigger: string,
	display: oneOf(["citekey", "inline", "tag", "pageref", "citation", "popover", "zettlr"]),
	format: oneOf(["citekey", "inline", "tag", "pageref", "citation", "popover", "zettlr"])
});

const copySettingsType = shape({
	always: bool,
	defaultFormat: oneOfType([func, oneOf(["citation", "citekey", "page-reference", "raw", "tag"])]),
	overrideKey: oneOf(["altKey", "ctrlKey", "metaKey", "shiftKey"]),
	useQuickCopy: bool
});

const metadataSettingsType = shape({
	func: string,
	smartblock: shape({
		param: oneOf(["srcName", "srcUid"]),
		paramValue: string
		// TODO: check if there is additional SmartBlock config to describe and support
	}),
	use: oneOf(["function", "smartblock"])
});

const notesSettingsType = shape({
	func: string,
	split_char: string,
	use: oneOf(["raw", "text"])
});

const otherSettingsType = shape({
	autoload: bool,
	darkTheme: bool,
	render_inline: bool,
	shareErrors: bool
});

const pageMenuSettingsType = shape({
	defaults: arrayOf(oneOf(["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"])),
	trigger: oneOfType([func, bool])
});

const sciteBadgeSettingsType = shape({
	layout: oneOf(["horizontal", "vertical"]),
	showLabels: bool,
	showZero: bool,
	small: bool,
	tooltipPlacement: oneOf(["auto", "top", "left", "right", "bottom"]),
	tooltipSlide: number
});

const webImportSettingsType = shape({
	tags: arrayOf(string)
});

const requests = {
	dataRequests: arrayOf(shape({
		apikey: string,
		dataURI: string,
		library: string,
		name: string,
		params: string
	})),
	apiKeys: arrayOf(string),
	libraries: arrayOf(shape({
		apikey: string,
		path: string
	}))
};
const requestsType = shape(requests);

const userSettings = {
	annotations: annotationsSettingsType,
	autocomplete: autocompleteSettingsType,
	copy: copySettingsType,
	metadata: metadataSettingsType,
	notes: notesSettingsType,
	other: otherSettingsType,
	pageMenu: pageMenuSettingsType,
	sciteBadge: sciteBadgeSettingsType,
	shortcuts: objectOf(string),
	typemap: objectOf(string),
	webimport: webImportSettingsType
};
const userSettingsType = shape(userSettings);

const initSettingsType = shape({
	...requests,
	...userSettings
});

export {
	zoteroCollectionType,
	zoteroItemType,
	zoteroLibraryType,
	zoteroTagType,
	taglistEntry,
	cleanAnnotationItemType,
	cleanLibraryItemType,
	cleanLibraryReturnArrayType,
	cleanLibraryPDFType,
	cleanNoteItemType,
	cleanRecentItemType,
	cleanRelatedItemType,
	cleanSemanticReturnType,
	cleanSemanticReturnObjectType,
	annotationsSettingsType,
	autocompleteSettingsType,
	copySettingsType,
	metadataSettingsType,
	notesSettingsType,
	otherSettingsType,
	pageMenuSettingsType,
	sciteBadgeSettingsType,
	webImportSettingsType,
	extensionType,
	requestsType,
	userSettingsType,
	initSettingsType
};
