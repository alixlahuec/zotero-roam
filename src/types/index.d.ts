import ZoteroRoam from "../api";
import { Roam } from "@services/roam";
import { SmartblocksPlugin } from "@services/smartblocks";

import { LegacyUserSettings } from "./extension";


declare global {
	interface Window {
		roamAlphaAPI: Roam.AlphaAPI

		// https://github.com/dvargas92495/roamjs-components/blob/main/src/types/index.ts
		roamjs?: {
			extension: {
				smartblocks?: SmartblocksPlugin.API
			},
			loaded: Set<string>
		}

		zoteroRoam: ZoteroRoam

		zoteroRoam_settings: LegacyUserSettings
	}
}