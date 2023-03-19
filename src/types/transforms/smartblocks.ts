export interface SmartblockConfig {
	/** The type of SmartBlock identifier provided */
	param: "srcName" | "srcUid",
	/** The value of the SmartBlock identifier */
	paramValue: string
}
