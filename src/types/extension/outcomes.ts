import { SBConfig } from "@services/smartblocks";

import { RImportableElement } from "Types/transforms";


export type ArgsMetadataSmartblock = {
	smartblock: SBConfig,
	uid: string
};

export type ArgsMetadataBlocks = {
	blocks: RImportableElement[],
	uid: string
};

export type OutcomePage = {
	new: boolean,
	title: string,
	uid: string
};

export type OutcomeMetadataStatus =
	| { error: null, success: true }
	| { error: Error, success: false }
	| { error: null, success: null }
;