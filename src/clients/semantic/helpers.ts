import { parseDOI } from "../../utils";


// TODO: rename and move to a better place
// TODO: create a type helper and use that instead of ReturnType in Types
/** Selects and transforms Semantic items with valid DOIs
 * @param arr - The array of Semantic items to clean
 * @returns The clean Semantic array
 */
function parseSemanticDOIs<T extends { doi: string | false | null }>(arr: T[]) {
	return arr.map(elem => {
		const { doi, ...rest } = elem;
		return {
			doi: parseDOI(doi),
			...rest
		};
	});
}


export { parseSemanticDOIs };