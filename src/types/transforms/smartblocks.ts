import { RImportableBlock } from "./roam";


export interface SBConfig {
	/** The type of SmartBlock identifier provided */
	param: "srcName" | "srcUid",
	/** The value of the SmartBlock identifier */
	paramValue: string
}

export type SBImportableBlock = Omit<RImportableBlock, "children"> & { children: SBImportableBlock[] };
