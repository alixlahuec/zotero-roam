import PropTypes from "prop-types";

const zoteroCollectionType = PropTypes.shape({
	data: PropTypes.object,
	key: PropTypes.string,
	library: PropTypes.object,
	links: PropTypes.object,
	meta: PropTypes.object,
	version: PropTypes.number
});

const zoteroItemType = PropTypes.shape({
	data: PropTypes.object,
	has_citekey: PropTypes.bool,
	key: PropTypes.string,
	library: PropTypes.object,
	meta: PropTypes.object,
	version: PropTypes.number
});

const zoteroLibraryType = PropTypes.shape({
	apikey: PropTypes.string,
	path: PropTypes.string
});


/**
 * @see cleanLibraryItem
 */
const cleanLibraryItemType = PropTypes.shape({
	abstract: PropTypes.string,
	authors: PropTypes.string,
	authorsFull: PropTypes.arrayOf(PropTypes.string),
	authorsLastNames: PropTypes.arrayOf(PropTypes.string),
	authorsRoles: PropTypes.arrayOf(PropTypes.string),
	children: PropTypes.shape({
		pdfs: PropTypes.arrayOf(zoteroItemType),
		notes: PropTypes.arrayOf(zoteroItemType),
	}),
	inGraph: PropTypes.oneOf([PropTypes.string, false]),
	itemKey: PropTypes.string,
	itemType: PropTypes.string,
	key: PropTypes.string,
	location: PropTypes.string,
	publication: PropTypes.string,
	tags: PropTypes.array,
	title: PropTypes.string,
	weblink: PropTypes.string,
	year: PropTypes.oneOf([PropTypes.instanceOf(Date), ""]),
	zotero: PropTypes.shape({
		local: PropTypes.string,
		web: PropTypes.string
	}),
	_multiField: PropTypes.string,
	raw: zoteroItemType
});
const cleanLibraryReturnArrayType = PropTypes.arrayOf(cleanLibraryItemType);

/**
 * @see cleanRelatedItem
 */
const cleanRelatedItemType = PropTypes.shape({
	abstract: PropTypes.string,
	added: PropTypes.instanceOf(Date),
	children: PropTypes.shape({
		pdfs: PropTypes.arrayOf(zoteroItemType),
		notes: PropTypes.arrayOf(zoteroItemType)
	}),
	inGraph: PropTypes.bool,
	itemType: PropTypes.string,
	key: PropTypes.string,
	location: PropTypes.string,
	meta: PropTypes.string,
	raw: zoteroItemType,
	timestamp: PropTypes.string,
	title: PropTypes.string
});

/**
 * @see cleanSemanticItem
 */
const cleanSemanticItemType = PropTypes.shape({
	authors: PropTypes.string,
	authorsLastNames: PropTypes.string,
	authorsString: PropTypes.string,
	doi: PropTypes.oneOf([PropTypes.string, false]),
	intent: PropTypes.arrayOf(PropTypes.string),
	isInfluential: PropTypes.bool,
	links: PropTypes.object,
	meta: PropTypes.string,
	title: PropTypes.string,
	url: PropTypes.string,
	year: PropTypes.string,
	_multiField: PropTypes.string
});

/**
 * @see cleanSemanticMatch
 */
const cleanSemanticReturnType = PropTypes.shape({
	...cleanSemanticItemType,
	inGraph: PropTypes.oneOf([false, PropTypes.string]),
	inLibrary: PropTypes.oneOf([false, PropTypes.shape({
		children: {
			pdfs: PropTypes.arrayOf(zoteroItemType),
			notes: PropTypes.arrayOf(zoteroItemType)
		},
		raw: zoteroItemType
	})]),
	_type: PropTypes.oneOf(["cited", "citing"])
});

/**
 * @see cleanSemantic
 */
const cleanSemanticReturnObjectType = PropTypes.shape({
	backlinks: PropTypes.arrayOf(cleanSemanticReturnType),
	citations: PropTypes.arrayOf(cleanSemanticReturnType),
	references: PropTypes.arrayOf(cleanSemanticReturnType),
});

/**
 * USER SETTINGS
 */
const copySettingsType = PropTypes.shape({
	always: PropTypes.bool,
	defaultFormat: PropTypes.oneOf(["citation", "citekey", "page-reference", "raw", "tag", PropTypes.func]),
	overrideKey: PropTypes.oneOf(["altKey", "ctrlKey", "metaKey", "shiftKey"]),
	useQuickCopy: PropTypes.bool
});

const extensionType = PropTypes.shape({
	apiKeys: PropTypes.arrayOf(PropTypes.string),
	dataRequests: PropTypes.array,
	libraries: PropTypes.arrayOf(zoteroLibraryType),
	portalId: PropTypes.string,
	version: PropTypes.string
});

const userSettingsType = PropTypes.shape({
	autocomplete: PropTypes.shape({
		trigger: PropTypes.string,
		display: PropTypes.oneOf(["citekey", "inline", "tag", "pageref", "citation", "popover", "zettlr"]),
		format: PropTypes.oneOf(["citekey", "inline", "tag", "pageref", "citation", "popover", "zettlr"])
	}),
	autoload: PropTypes.bool,
	copy: copySettingsType,
	metadata: PropTypes.object,
	render_inline: PropTypes.bool,
	shortcuts: PropTypes.object,
	typemap: PropTypes.object,
	webimport: PropTypes.shape({
		tags: PropTypes.arrayOf(PropTypes.string)
	})
});

export {
	zoteroCollectionType,
	zoteroItemType,
	zoteroLibraryType,
	cleanLibraryItemType,
	cleanLibraryReturnArrayType,
	cleanRelatedItemType,
	cleanSemanticReturnType,
	cleanSemanticReturnObjectType,
	copySettingsType,
	extensionType,
	userSettingsType
};
