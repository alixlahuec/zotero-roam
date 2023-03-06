/** The coordinates of a block in Roam's interface */
export interface BlockFocusLocation {
	/** The UID of the block */
	"block-uid": string,
	/** The id of the block's window */
	"window-id": string
}

export type SidebarWindowType = "outline" | "block" | "graph" | "mentions";

export type ViewType = "bullet" | "document" | "numbered";