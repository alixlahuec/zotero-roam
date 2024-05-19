export namespace Roam {
	/** The coordinates of a block in Roam's interface */
	export type BlockFocusLocation = {
		/** The UID of the block */
		"block-uid": string,
		/** The id of the block's window */
		"window-id": string
	};

	export type BlockOrder = number | "last";
	type Heading = 0 | 1 | 2 | 3;
	export type SidebarWindowType = "outline" | "block" | "graph" | "mentions";
	type TextAlign = "left" | "center" | "right" | "justify";
	type ViewType = "bullet" | "document" | "numbered";

	export interface ExtensionSettingsConfig {
		tabTitle: string,
		settings: {
			/** Must be a non-empty string, and cannot contain ".", "#", "$", "[", or "]" */
			id: string,
			name: string,
			description?: string,
			action: unknown
		}[]
	}

	/**
	 * Methods available via the `window.roamAlphaAPI` object.
	 * @see https://roamresearch.com/#/app/developer-documentation/page/j6s5Gd5js
	 */
	export interface AlphaAPI {

		data: {
			block: {
				/** Creates a new block at a given location.
				 * @see https://roamresearch.com/#/app/developer-documentation/page/Sq5IhwNQY
				 */
				create: (args: {
					location: {
						/** The UID of the block's parent */
						"parent-uid": string;
						/** The position where the block should be inserted (zero-indexed) */
						order: BlockOrder;
					},
					block: {
						/** The string contents for the block */
						string: string;
						/** The UID for the block */
						uid?: string;
						/** The initial open/collapsed state for the block */
						open?: boolean;
						/** The heading style for the block */
						heading?: Heading;
						/** The text alignment for the block */
						"text-align"?: TextAlign
						/** The view type for the block */
						"children-view-type"?: ViewType;
					}
				}) => Promise<void | null | undefined>
			},

			page: {
				/** Creates a new page.
				 * Pages with title in the format of `January 21st, 2021` will create a new daily note if it does not yet exist.
				 * @see https://roamresearch.com/#/app/developer-documentation/page/1jMc3V1QE
				 */
				create: (args: {
					page: {
						/** The title for the page */
						title: string,
						/** The UID for the page */
						uid?: string,
						/** The view type for the page */
						"children-view-type"?: ViewType
					}
				}) => Promise<void | null | undefined>,
			},

			/** Runs a Datalog query against the graph.
			 * @see https://roamresearch.com/#/app/developer-documentation/page/SI3FNt3EQ 
			 */
			q: <T>(query: string, ...params: any[]) => T,
		},

		graph: {
			/** The name of the Roam graph */
			name: string
		},

		ui: {
			commandPalette: {
				/** Adds a command to the Command Palette (Cmd+P), and calls the provided callback when the user selects that command. If called again with the same `label`, will not add a second command, but will update the first command with the new callback.
				 * @see https://roamresearch.com/#/app/developer-documentation/page/rAkidgrv3
				 */
				addCommand: (args: {
					/** The function called when the user selects the command from the palette */
					callback: () => void,
					/** The display name for the command in the palette */
					label: string
				}) => Promise<void>,

				/** Removes a command with the given `label` from the Command Palette
				 * @see https://roamresearch.com/#/app/developer-documentation/page/eG9ulEdWq
				 * @returns 
				 */
				removeCommand: (args: {
					/** The display name of the targeted command */
					label: string
				}) => Promise<void>
			},

			/** Returns metadata about the currently focused block (or null, if no currently selected block).
			 * @see https://roamresearch.com/#/app/developer-documentation/page/WSy7_Gxf1
			 */
			getFocusedBlock: () => BlockFocusLocation | null,

			mainWindow: {
				/** Opens a page with the given title (or uid)
				 * @see https://roamresearch.com/#/app/developer-documentation/page/_VyuLpfWb
				 */
				openPage: (args: {
					page: {
						/** The title of the targeted page */
						title?: string,
						/** The UID of the targeted page */
						uid?: string
					}
				}) => Promise<void>
			},

			rightSidebar: {
				/** Adds a window to the right sidebar. If the sidebar is closed, opens it.
				 * @see https://roamresearch.com/#/app/developer-documentation/page/yHDobV8KV
				 */
				addWindow: (args: {
					window: {
						/** The UID of the block or page. */
						"block-uid": string,
						/** The order in which the window should be positioned. */
						order?: number,
						/** The type of window to add. */
						type: SidebarWindowType,
					}
				}) => Promise<void>
			},

			/** Focuses the user's cursor to a given location in the interface.
			 * @see https://roamresearch.com/#/app/developer-documentation/page/peR33ZsAb
			 */
			setBlockFocusAndSelection: (args: {
				/** The targeted location. If not provided, will default to the currently focused block. */
				location?: BlockFocusLocation,
				/** The targeted position of the cursor within the block. If not provided, will default to the end of the block. */
				selection?: {
					start: number,
					end?: number
				}
			}) => void
		},

		util: {
			/** Converts a Date into a DNP page title.
			 * @see https://roamresearch.com/#/app/developer-documentation/page/G9TZzJ0oO
			 */
			dateToPageTitle: (date: Date) => string,
			/** Generates a Roam block UID, which is a random string of length nine.
			 * @see https://roamresearch.com/#/app/developer-documentation/page/cMeEb11Bx
			 */
			generateUID: () => string,
			/** Converts a DNP page title (e.g. "April 6th, 2021") into a Date.
			 * The date will be expressed in the local timezone (e.g. Tue Apr 06 2021 00:00:00 GMT-0400 (Eastern Daylight Time)).
			 * @see https://roamresearch.com/#/app/developer-documentation/page/daF13_WNI
			 */
			pageTitleToDate: (title: string) => Date
		}

	}

	/**
	 * Methods available via the `extensionAPI` object, passed to the `onload` function of an extension.
	 * @see https://roamresearch.com/#/app/developer-documentation/page/y31lhjIqU
	 */
	export interface ExtensionAPI {
		settings: {
			/** Getter for a single setting */
			get: <T = unknown>(key: string) => T | undefined,
			/** Getter for all the extension's settings */
			getAll: () => Record<string, unknown>,
			/** Setter for a single setting */
			set: (key: string, value: unknown) => void,

			panel: {
				/**
				 * Create a tab for the extension in Roam's Settings modal
				 * @see https://roamresearch.com/#/app/developer-documentation/page/lYXVdlZSQ */
				create: (config: ExtensionSettingsConfig) => void
			}

		},
		ui: {

			commandPalette: {
				/** @see https://roamresearch.com/#/app/developer-documentation/page/XThfc9LJ6 */
				addCommand: AlphaAPI["ui"]["commandPalette"]["addCommand"],
				/** @see https://roamresearch.com/#/app/developer-documentation/page/AsyQmgs27 */
				removeCommand: AlphaAPI["ui"]["commandPalette"]["removeCommand"]
			}

		}
	}
}