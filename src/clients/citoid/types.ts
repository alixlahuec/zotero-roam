import { ZoteroAPI } from "../zotero";


export namespace CitoidAPI {
	export type AsZotero = Omit<ZoteroAPI.ItemTop["data"], "key"> & {
		itemKey?: string,
		key?: string
	};
}
