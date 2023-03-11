/* UTILS */

export type Maybe<T> = T | undefined;

/* SMARTBLOCKS */

export interface SmartblockConfig {
	/** The type of SmartBlock identifier provided */
	param: "srcName" | "srcUid",
	/** The value of the SmartBlock identifier */
	paramValue: string
}

/* ZOTERO */

export interface ZLibrary {
	apikey: string,
	path: string
}