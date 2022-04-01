import { array, arrayOf, bool, func, instanceOf, number, object, oneOf, oneOfType, shape, string } from "prop-types";

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
		notes: arrayOf(oneOf([zoteroItemType, object])),
	}),
	inGraph: oneOfType([string, oneOf([false])]),
	itemKey: string,
	itemType: string,
	key: string,
	location: string,
	publication: string,
	tags: array,
	title: string,
	weblink: oneOfType([shape({ href: string, title: string }), oneOf([false])]),
	year: oneOfType([instanceOf(Date), string]),
	zotero: shape({
		local: string,
		web: string
	}),
	_multiField: string,
	raw: zoteroItemType
});
const cleanLibraryReturnArrayType = arrayOf(cleanLibraryItemType);

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
	inGraph: bool,
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
const cleanSemanticItemType = shape({
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
});

/**
 * @see cleanSemanticMatch
 */
const cleanSemanticReturnType = shape({
	...cleanSemanticItemType,
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
const copySettingsType = shape({
	always: bool,
	defaultFormat: oneOfType([func, oneOf(["citation", "citekey", "page-reference", "raw", "tag"])]),
	overrideKey: oneOf(["altKey", "ctrlKey", "metaKey", "shiftKey"]),
	useQuickCopy: bool
});

const extensionType = shape({
	apiKeys: arrayOf(string),
	dataRequests: array,
	libraries: arrayOf(zoteroLibraryType),
	portalId: string,
	version: string
});

const userSettingsType = shape({
	autocomplete: shape({
		trigger: string,
		display: oneOf(["citekey", "inline", "tag", "pageref", "citation", "popover", "zettlr"]),
		format: oneOf(["citekey", "inline", "tag", "pageref", "citation", "popover", "zettlr"])
	}),
	autoload: bool,
	copy: copySettingsType,
	darkTheme: bool,
	metadata: object,
	notes: shape({
		func: string,
		split_char: string,
		use: oneOf(["raw", "text"])
	}),
	pageMenu: shape({
		defaults: arrayOf(string),
		trigger: oneOfType([func, bool])
	}),
	render_inline: bool,
	shortcuts: object,
	typemap: object,
	webimport: shape({
		tags: arrayOf(string)
	})
});

export {
	zoteroCollectionType,
	zoteroItemType,
	zoteroLibraryType,
	zoteroTagType,
	taglistEntry,
	cleanLibraryItemType,
	cleanLibraryReturnArrayType,
	cleanRelatedItemType,
	cleanSemanticReturnType,
	cleanSemanticReturnObjectType,
	copySettingsType,
	extensionType,
	userSettingsType
};
