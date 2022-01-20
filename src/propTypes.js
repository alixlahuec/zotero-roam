import PropTypes from "prop-types";

/**
 * @see cleanLibrary
 */
const cleanLibraryItemType = PropTypes.shape({
	abstract: PropTypes.string,
	authors: PropTypes.string,
	authorsFull: PropTypes.arrayOf(PropTypes.string),
	authorsLastNames: PropTypes.arrayOf(PropTypes.string),
	authorsRoles: PropTypes.arrayOf(PropTypes.string),
	authorsString: PropTypes.string,
	children: PropTypes.shape({
		pdfs: PropTypes.arrayOf(PropTypes.object),
		notes: PropTypes.arrayOf(PropTypes.object),
	}),
	inGraph: PropTypes.oneOf([PropTypes.string, false]),
	itemKey: PropTypes.string,
	itemType: PropTypes.string,
	key: PropTypes.string,
	location: PropTypes.string,
	publication: PropTypes.string,
	tags: PropTypes.array,
	tagsString: PropTypes.string,
	title: PropTypes.string,
	weblink: PropTypes.string,
	year: PropTypes.oneOf([PropTypes.instanceOf(Date), ""]),
	zotero: PropTypes.shape({
		local: PropTypes.string,
		web: PropTypes.string
	}),
	_multiField: PropTypes.string,
	raw: PropTypes.object
});
const cleanLibraryReturnArrayType = PropTypes.arrayOf(cleanLibraryItemType);

/**
 * @see cleanRelatedItem
 */
const cleanRelatedItemType = PropTypes.shape({
	abstract: PropTypes.string,
	added: PropTypes.instanceOf(Date),
	inGraph: PropTypes.bool,
	itemType: PropTypes.string,
	key: PropTypes.string,
	location: PropTypes.string,
	meta: PropTypes.string,
	raw: PropTypes.object,
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
});

/**
 * @see cleanSemantic
 */
const cleanSemanticReturnType = PropTypes.shape({
	...cleanSemanticItemType,
	inGraph: PropTypes.oneOf([false, PropTypes.string]),
	inLibrary: PropTypes.oneOf([false, PropTypes.object]),
	_type: PropTypes.oneOf(["cited", "citing"])
});
const cleanSemanticReturnObjectType = PropTypes.shape({
	backlinks: PropTypes.arrayOf(cleanSemanticReturnType),
	citations: PropTypes.arrayOf(cleanSemanticReturnType),
	references: PropTypes.arrayOf(cleanSemanticReturnType),
});

export {
	cleanLibraryItemType,
	cleanLibraryReturnArrayType,
	cleanRelatedItemType,
	cleanSemanticReturnType,
	cleanSemanticReturnObjectType
};
