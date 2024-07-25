import { SBConfig } from "./types";

import { AsBoolean } from "Types/helpers";
import { RImportableElement, SBImportableBlock } from "Types/transforms";


/** Evaluates an "AND" query against a given props array
 * @param terms - The terms of the "AND" query 
 * @param props - The props to test the query against 
 * @returns The query's outcome (`true` if all props match the query, `false` otherwise)
 */
function evalAND(terms: string[], props: string[]): boolean {
	let outcome = true;
	for (let i = 0; i < terms.length && outcome == true; i++) {
		outcome = evalTerm(terms[i], props);
	}
	return outcome;
}


/** Evaluates an "OR" query against a given props array
 * @param terms - The terms of the "OR" query 
 * @param props - The props to test the query against 
 * @returns The query's outcome (`true` if any of the props matches the query, `false` otherwise)
 */
function evalOR(terms: string[], props: string[]): boolean {
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
 * @param query - The query to test against the props
 * @param props - The props to test the query against
 * @returns The query's outcome (`true` if the props include a string that matches the query, `false` otherwise)
 */
function processQuery(query: string, props: string[]): boolean {
	// eslint-disable-next-line no-useless-escape
	const components = query.split(/([\|\&]?)([^\&\|\(\)]+|\(.+\))([\|\&]?)/).filter(AsBoolean);
	if (components.includes("|")) {
		return evalOR(components.filter(c => c != "|"), props);
	} else {
		return evalAND(components.filter(c => c != "&"), props);
	}
}


/** Enforces the block-object format (recursively) for an array of importable elements. This is needed for correctly importing nested blocks with SmartBlocks. */
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


export type UseSmartblockOutcome = {
	args: {
		smartblock: SBConfig,
		uid: string
	},
	raw: Record<string, any>
} & ({ error: null, success: true } | { error: Error, success: false });

/* istanbul ignore next */
/** Triggers a Smartblock, with optional context.
 * @param targetUid - The UID where the Smartblock should be triggered.
 * @param config - The configuration of the Smartblock to use.
 * @param context - The context variables that should be available to the Smartblock.
 * @see https://roamjs.com/extensions/smartblocks/developer_docs
 */
async function useSmartblock(
	targetUid: string,
	config: SBConfig,
	variables: Record<string, any> = {}
): Promise<UseSmartblockOutcome> {
	const { param: sbProp, paramValue: sbPropValue } = config;

	const defaultOutcome = {
		args: {
			smartblock: config,
			uid: targetUid
		},
		error: null,
		raw: variables,
		success: null
	};

	const obj = {
		targetUid,
		variables,
		[sbProp]: sbPropValue
	};

	try {
		await window.roamjs?.extension?.smartblocks?.triggerSmartblock(obj);
		return Promise.resolve({
			...defaultOutcome,
			success: true
		});
	} catch (e) {
		window.zoteroRoam?.error?.({
			origin: "SmartBlocks",
			message: "Failed to trigger SmartBlock",
			context: {
				...obj,
				error: e.message
			}
		});

		return Promise.resolve({
			...defaultOutcome,
			error: e,
			success: false
		});
	}
}

export { evalTerm, processQuery, reformatImportableBlocks, useSmartblock };