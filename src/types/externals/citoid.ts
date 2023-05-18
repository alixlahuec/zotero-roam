import { ZoteroAPI } from "./zotero";


export namespace CitoidAPI {
	export type AsZotero = ZoteroAPI.ItemTop["data"] & {
		itemKey?: string,
		key?: string
	};
}
