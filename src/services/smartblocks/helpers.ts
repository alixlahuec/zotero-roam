import { AsBoolean } from "Types/helpers";
import { RImportableElement, SBImportableBlock } from "Types/transforms";


/** Evaluates an "AND" query against a given props array 
 * @returns The query's outcome (`true` if all props match the query, `false` otherwise)
 */
function evalAND(
	/** The terms of the "AND" query */
	terms: string[],
	/** The props to test the query against */
	props: string[]
): boolean {
	let outcome = true;
	for (let i = 0; i < terms.length && outcome == true; i++) {
		outcome = evalTerm(terms[i], props);
	}
	return outcome;
}


/** Evaluates an "OR" query against a given props array 
 * @returns The query's outcome (`true` if any of the props matches the query, `false` otherwise)
 */
function evalOR(
	/** The terms of the "OR" query */
	terms: string[],
	/** The props to test the query against */
	props: string[]
): boolean {
	let outcome = false;
	for (let i = 0; i < terms.length && outcome == false; i++) {
		outcome = evalTerm(terms[i], props);
	}
	return outcome;
}


/** Evaluates how a query term should be handled. If the term is a (grouping), the outer parentheses are stripped and the contents are evaluated against the props array that was provided. If the term is a -negation, verify that the props *do not* include it ; otherwise, verify that the props include the term. 
 * @returns The outcome of the term's evaluation against the props
 */
function evalTerm(
	/** The query term to evaluate */
	term: string,
	/** The props that are being tested */
	props: string[]
): boolean {
	if (term.startsWith("(") && term.endsWith(")")) {
		const clean_str = term.slice(1, -1);
		return processQuery(clean_str, props);
	} else {
		if (term.startsWith("-")) {
			const clean_str = term.slice(1);
			return !props.includes(clean_str);
		} else {
			return props.includes(term);
		}
	}
}


/** Returns the outcome of a given query against a given props array
 * @returns The query's outcome (`true` if the props include a string that matches the query, `false` otherwise)
 */
function processQuery(
	/** The query to test against the props */
	query: string,
	/** The props to test the query against */
	props: string[]
): boolean {
	// eslint-disable-next-line no-useless-escape
	const components = query.split(/([\|\&]?)([^\&\|\(\)]+|\(.+\))([\|\&]?)/).filter(AsBoolean);
	if (components.includes("|")) {
		return evalOR(components.filter(c => c != "|"), props);
	} else {
		return evalAND(components.filter(c => c != "&"), props);
	}
}


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


export { evalTerm, processQuery, reformatImportableBlocks };