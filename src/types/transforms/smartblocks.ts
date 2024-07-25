import { RImportableBlock } from "./roam";

export type SBImportableBlock = Omit<RImportableBlock, "children"> & { children: SBImportableBlock[] };
