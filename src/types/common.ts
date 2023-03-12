/* UTILS */

// https://stackoverflow.com/a/73913774/21032793
export const isFulfilled = <T,>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> => p.status === "fulfilled";
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