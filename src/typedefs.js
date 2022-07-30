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
 * comment_prefix: String,
 * comment_suffix: String,
 * func: String,
 * group_by: ("day_added"|false),
 * highlight_prefix: String,
 * highlight_suffix: String,
 * use: ("formatted"|"raw")
 * }}
 * SettingsAnnotations
 */

/**
 * @typedef {{
 * func: String,
 * split_char: String,
 * use: ("raw"|"text")
 * }}
 * SettingsNotes
 */

/**
 * @typedef {Object.<string, string>}
 * SettingsTypemap
 */