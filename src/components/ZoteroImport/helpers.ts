import { ZoteroAPI } from "@clients/zotero";
import { ZEnrichedCollection } from "Types/transforms";


/** Sorts the children of a Zotero collection, with nested children
 * @returns The sorted array
 */
function sortCollectionChildren(
	parent: ZoteroAPI.Collection,
	children: ZoteroAPI.Collection[],
	depth = 0
): ZEnrichedCollection[] {
	const parColl = {
		...parent,
		depth
	};

	const chldn = children.filter(ch => ch.data.parentCollection == parColl.key);
	// If the collection has children, recurse
	if (chldn.length > 0) {
		const collArray = [parColl];
		// Go through each child collection 1-by-1
		// If a child has children itself, the recursion should ensure everything gets added where it should
		for (let j = 0; j < chldn.length; j++) {
			collArray.push(...sortCollectionChildren(chldn[j], children, depth + 1));
		}
		return collArray;
	} else {
		return [parColl];
	}

}


/** Sorts an array of Zotero collections in A-Z order, with child collections
 * @param arr - The array of Zotero collections to sort
 * @returns The sorted array
 */
function sortCollections(arr: ZoteroAPI.Collection[]): ZEnrichedCollection[] {
	if (arr.length > 0) {
		// Sort collections A-Z
		const array = [...arr].sort((a, b) => (a.data.name.toLowerCase() < b.data.name.toLowerCase() ? -1 : 1));
		const childColls = array.filter(cl => cl.data.parentCollection);
		const topColls: ZEnrichedCollection[] = array
			.filter(cl => !cl.data.parentCollection)
			.map(cl => ({ ...cl, depth: 0 }));

		const orderedArray: ZEnrichedCollection[] = [];

		for (let k = 0; k < topColls.length; k++) {
			const chldn = childColls.filter(ch => ch.data.parentCollection == topColls[k].key);
			// If the collection has children, pass it to sortCollectionChildren to recursively process the nested collections
			if (chldn.length > 0) {
				orderedArray.push(...sortCollectionChildren(topColls[k], childColls));
			} else {
				orderedArray.push(topColls[k]);
			}
		}
		return orderedArray;
	} else {
		return [];
	}
}


export { sortCollections };