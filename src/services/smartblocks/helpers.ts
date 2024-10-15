import { RImportableElement, SBImportableBlock } from "Types/transforms";


/** Enforces the block-object format (recursively) for an array of importable elements.
 * This is needed for correctly importing nested blocks with SmartBlocks.
 */
function reformatImportableBlocks(arr: RImportableElement[]): SBImportableBlock[] {
	if (!arr) {
		return [];
	} else {
		return arr.map(blck => {
			if (typeof (blck) === "string") {
				return {
					string: blck,
					text: blck,
					children: []
				};
			} else if (typeof (blck) === "object") {
				return {
					...blck,
					children: reformatImportableBlocks(blck.children || [])
				};
			} else {
				window.zoteroRoam?.error?.({
					origin: "Metadata",
					message: "Bad element received",
					context: {
						element: blck
					}
				});
				throw new Error(`All array items should be of type String or Object, not ${typeof (blck)}`);
			}
		});
	}
}


export { reformatImportableBlocks };