import { Roam } from "@services/roam";


/**
 * Mapping between the title and UID of all citekey pages in the Roam graph.
 */
export type RCitekeyPages = Map<string, string>;

/**
 * Mapping between the title and metadata (uid, last-edited time) of all citekey pages in the Roam graph.
 */
export type RCitekeyPagesWithEditTime = Map<string, { edited: Date, uid: string }>;

/**
 * Location parameters for the user's cursor within the Roam interface
 */
export interface RCursorLocation {
	/** The `id` of the DOM element */
	id: string,
	/** The coordinates of the Roam block where cursor focus is, or should be */
	location: Roam.BlockFocusLocation,
	/** The indices for making the cursor into a selection */
	selection?: { start: number, end: number }
}

/**
 * A block-format element that can be imported to Roam, by the extension or a SmartBlock.
 */
export interface RImportableBlock {
	/** Child elements to nest under the block */
	children?: RImportableElement[],
	/** Position in which the block should be inserted under its parent */
	order?: number,
	/** The UID of the block's parent */
	parentUID?: string,
	/** The string contents of the block. Required for importing via the extension's importers. */
	string: string,
	/** The string contents of the block. Required for importing via a SmartBlock. */
	text: string
}

/**
 * An element that can be imported to Roam by the extension.
 */
export type RImportableElement = RImportableBlock | string;