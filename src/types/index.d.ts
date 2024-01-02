import ZoteroRoam from "../extension";
import { LegacyUserSettings } from "./extension";
import { SmartblocksPlugin, Roam } from "./externals";


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