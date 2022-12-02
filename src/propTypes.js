import { arrayOf, bool, instanceOf, number, object, objectOf, oneOf, oneOfType, shape, string } from "prop-types";


const zoteroAnnotationType = shape({
	data: shape({
		annotationColor: string,
		annotationComment: string,
		annotationPageLabel: string,
		annotationPosition: string,
		annotationSortIndex: string,
		annotationText: string,
		annotationType: oneOf(["highlight", "image"]),
		dateAdded: string,
		dateModified: String,
		itemType: oneOf(["annotation"]),
		key: string,
		parentItem: string,
		relations: object,
		tags: arrayOf(object),
		version: number
	}),
	key: string,
	library: object,
	links: object,
	meta: object,
	version: number
});

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
 * @see ZoteroRoamLog
 */

const logEntry = shape({
	context: object,
	level: oneOf(["error", "info", "warning"]),
	message: string,
	origin: string,
	timestamp: instanceOf(Date)
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
		notes: arrayOf(oneOfType([zoteroItemType, zoteroAnnotationType])),
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
	annotations: arrayOf(zoteroAnnotationType),
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
		notes: arrayOf(oneOfType([zoteroItemType, zoteroAnnotationType]))
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
		notes: arrayOf(oneOfType([zoteroItemType, zoteroAnnotationType]))
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
	authorsLastNames: arrayOf(string),
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
				notes: arrayOf(oneOfType([zoteroItemType, zoteroAnnotationType]))
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
	func: string,
	group_by: oneOf(["day_added", false]),
	template_comment: string,
	template_highlight: string,
	use: oneOf(["default", "function"]),
	__with: oneOf(["formatted", "raw"])
});

const autocompleteSettingsType = shape({
	trigger: string,
	display_char: string,
	display_use: oneOf(["preset", "custom"]),
	// legacy - should be display_preset
	display: oneOf(["citekey", "inline", "key", "tag", "pageref", "citation", "popover", "zettlr"]),
	format_char: string,
	format_use: oneOf(["preset", "custom"]),
	// legacy - should be format_preset
	format: oneOf(["citekey", "inline", "key", "tag", "pageref", "citation", "popover", "zettlr"])
});

const copySettingsType = shape({
	always: bool,
	overrideKey: oneOf(["altKey", "ctrlKey", "metaKey", "shiftKey"]),
	preset: oneOf(["citation", "citekey", "page-reference", "raw", "tag"]),
	template: string,
	useAsDefault: oneOf(["preset", "template"]),
	useQuickCopy: bool
});

const metadataSettingsType = shape({
	func: string,
	smartblock: shape({
		param: oneOf(["srcName", "srcUid"]),
		paramValue: string
	}),
	use: oneOf(["default", "function", "smartblock"])
});

const notesSettingsType = shape({
	func: string,
	nest_char: string,
	nest_position: oneOf(["top", "bottom"]),
	nest_preset: oneOf([false, "[[Notes]]"]),
	nest_use: oneOf(["preset", "custom"]),
	split_char: string,
	split_preset: oneOf(["\n", "</p>"]),
	split_use: oneOf(["preset", "custom"]),
	use: oneOf(["default", "function"]),
	__with: oneOf(["raw", "text"])
});

const otherSettingsType = shape({
	autoload: bool,
	darkTheme: bool,
	render_inline: bool
});

const pageMenuSettingsType = shape({
	defaults: arrayOf(oneOf(["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"])),
	trigger: oneOfType([bool, oneOf(["default"])])
});

const sciteBadgeSettingsType = shape({
	layout: oneOf(["horizontal", "vertical"]),
	showLabels: bool,
	showZero: bool,
	small: bool,
	tooltipPlacement: oneOf(["auto", "top", "left", "right", "bottom"]),
	tooltipSlide: number
});

const shortcutsSettingsType = objectOf(string);

const webImportSettingsType = shape({
	tags: arrayOf(string)
});

const dataRequestType = shape({
	apikey: string,
	dataURI: string,
	library: shape({
		id: string,
		path: string,
		type: oneOf(["groups", "users"]),
		uri: string
	}),
	name: string
});

const requests = {
	dataRequests: arrayOf(dataRequestType),
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
	shortcuts: shortcutsSettingsType,
	typemap: objectOf(string),
	webimport: webImportSettingsType
};
const userSettingsType = shape(userSettings);

const initSettingsType = shape({
	...requests,
	...userSettings
});

export {
	zoteroAnnotationType,
	zoteroCollectionType,
	zoteroItemType,
	zoteroLibraryType,
	zoteroTagType,
	taglistEntry,
	logEntry,
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
	shortcutsSettingsType,
	webImportSettingsType,
	extensionType,
	dataRequestType,
	requestsType,
	userSettingsType,
	initSettingsType
};
