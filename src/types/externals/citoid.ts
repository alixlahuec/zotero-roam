import { ZoteroAPI } from "./zotero";


export type CitoidZotero = Omit<ZoteroAPI.ItemTop["data"], "key"> & { itemKey?: string, key?: string };