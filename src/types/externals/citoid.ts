import { ZoteroItemTop } from "./zotero";


export type CitoidZotero = Omit<ZoteroItemTop["data"], "key"> & { itemKey?: string, key?: string };