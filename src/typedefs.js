/* istanbul ignore file */

/** 
 * @typedef {{
 * apikey: String,
 * path: String
 * }}
 * ZoteroLibrary
 */

/**
 * @typedef {{
 * access: Object,
 * key: String,
 * userID: Integer,
 * username: String
 * }}
 * ZoteroKey
 */

/**
 * @typedef {{
 * data: Object,
 * has_citekey?: Boolean,
 * key: String,
 * library: Object,
 * links: Object,
 * meta: Object,
 * version: Integer
 * }} 
 * ZoteroItem
 */

/**
 * @typedef {{
 * data: Object,
 * key: String,
 * library: Object,
 * links: Object,
 * meta: Object,
 * version: Integer
 * }}
 * ZoteroCollection
 */

/**
 * @typedef {{
 * links: Object,
 * meta: {numItems: Integer, type: Integer},
 * tag: String
 * }}
 * ZoteroTag
 */

/**
 * @typedef {{
 * data: { annotationColor: String, annotationComment: String, annotationPageLabel: String, annotationPosition: String, annotationSortIndex: String, annotationText: String, annotationType: ("highlight"|"image"), dateAdded: String, dateModified: String, itemType: ("annotation"), key: String, parentItem: String, relations: Object, tags: Object[], version: Integer },
 * key: String,
 * library: Object,
 * links: Object,
 * meta: Object,
 * version: Integer
 * }}
 * ZoteroAnnotation
 */

/**
 * @typedef {{
 * include: String,
 * linkwrap: Boolean,
 * locale: String,
 * style: String
 * }}
 * ConfigBibliography
 */

/**
 * @typedef {{
 * apikey: String,
 * dataURI: String,
 * library: { id: String, path: String, type: ("groups"|"users"), uri: String },
 * name: String
 * }}
 * DataRequest
 */

/**
 * @typedef {{
 * dataRequests: DataRequest[],
 * apiKeys: String[],
 * libraries: ZoteroLibrary[]
 * }}
 * ConfigRequests
 */

/**
 * @typedef {{
 * func: String,
 * group_by: ("day_added"|false),
 * template_comment: String,
 * template_highlight: String,
 * use: ("default"|"function"),
 * __with: ("formatted"|"raw")
 * }}
 * SettingsAnnotations
 */

/**
 * @typedef {("citekey"|"inline"|"tag"|"pageref"|"citation"|"popover"|"zettlr")} AutocompleteItemFormat
 */
/**
 * @typedef {{
 * trigger: String,
 * display: AutocompleteItemFormat,
 * format: AutocompleteItemFormat
 * }}
 * SettingsAutocomplete
 */

/**
 * @typedef {{
 * func: String,
 * smartblock: {SmartblockConfig},
 * use: ("default"|"function"|"smartblock")
 * }}
 * SettingsMetadata
 */

/**
 * @typedef {{
 * func: String,
 * split_char: String,
 * split_preset: ("\n"|"</p>"),
 * split_use: ("preset"|"custom")
 * use: ("default"|"function")
 * __with: ("raw"|"text")
 * }}
 * SettingsNotes
 */

/**
 * @typedef {Object.<string, string>}
 * SettingsTypemap
 */


// ---------------------------------------

/**
 * @typedef {{
 * param: ("srcName"|"srcUid"),
 * paramValue: String
 * }}
 * SmartblockConfig
 */

/**
 * @typedef {{
 * help: String,
 * handler: Function
 * }}
 * SmartblockCommand
 */