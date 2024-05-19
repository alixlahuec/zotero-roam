import { ZoteroAPI } from "Types/externals";


export namespace CitoidAPI {
	export type AsZotero = Omit<ZoteroAPI.ItemTop["data"], "key"> & {
		itemKey?: string,
		key?: string
	};
}
