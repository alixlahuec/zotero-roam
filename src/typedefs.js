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