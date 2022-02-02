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
 * library: Object,
 * links: Object,
 * meta: Object,
 * key: String,
 * version: Integer
 * }} 
 * ZoteroItem
 */

/**
 * @typedef {{
 * library: Object,
 * links: Object,
 * meta: Object,
 * data: Object,
 * key: String,
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