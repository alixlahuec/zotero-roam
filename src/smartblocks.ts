import { getLocalLink, getWebLink, makeDNP, parseDOI } from "./utils";
import { SmartblocksPlugin } from "Types/externals";
import { RImportableElement, SBConfig, SBImportableBlock, ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "Types/transforms";


/** Generates the list of custom SmartBlocks commands to register
 * @see https://roamjs.com/extensions/smartblocks/developer_docs
 */
const sbCommands = {
	"ZOTERORANDOMCITEKEY": {
		help: "Returns one or more Zotero citekeys, with optional tag query",
		handler: (_context: SmartblocksPlugin.CommandContext) => (nb = "1", query="") => {
			return window.zoteroRoam.getItems("items")
				.filter(it => processQuery(query, it.data.tags.map(t => t.tag)))
				.map(it => "@" + it.key)
				.sort(() => 0.5 - Math.random())
				.slice(0, Number(nb) || 1);
		}
	},
	"ZOTEROITEMABSTRACT": {
		help: "Returns the abstract of a Zotero item.",
		handler: (context: SmartblocksPlugin.CommandContext) => () => {
			const { item } = context.variables;
			return item.data.abstractNote || "";
		}
	},
	"ZOTEROITEMCITATION": {
		help: "Returns a formatted citation for a Zotero item. Options: style (default: 'chicago-note-bibliography'), locale (default: en-US), linkwrap (default: 0).",
		handler: (context: SmartblocksPlugin.CommandContext) => async(style = "chicago-note-bibliography", locale = "en-US", linkwrap: (0 | 1) = 0) => {
			const { item } = context.variables;
			return await window.zoteroRoam.getItemCitation(item, { style, locale, linkwrap });
		}
	},
	"ZOTEROITEMCITEKEY": {
		help: "Returns the citekey for a Zotero item, with the '@' prefix. If the item doesn't have a citekey, its Zotero key will be used. Options: brackets (`true` (default)|`false`).",
		handler: (context: SmartblocksPlugin.CommandContext) => (brackets = true) => {
			const { item } = context.variables;
			const citekey = "@" + item.key;
			return brackets
				? `[[${citekey}]]`
				: citekey;
		}
	},
	"ZOTEROITEMCOLLECTIONS": {
		help: "Returns the comma-separated list of the collection(s) a Zotero item belongs to.",
		handler: (context: SmartblocksPlugin.CommandContext) => (brackets = true) => {
			const { item } = context.variables;
			return window.zoteroRoam.getItemCollections(item, { return_as: "string", brackets });
		}
	},
	"ZOTEROITEMCREATORS": {
		help: "Returns the comma-separated list of the creator(s) of a Zotero item. Options: brackets (`true`(default)|`false`|`existing`), use_type(`true`(default)|`false`).",
		handler: (context: SmartblocksPlugin.CommandContext) => (brackets = true, use_type = true) => {
			const { item } = context.variables;
			return window.zoteroRoam.getItemCreators(item, { return_as: "string", brackets, use_type }) as string;
		}
	},
	"ZOTEROITEMDATEADDED": {
		help: "Returns the date on which an item was added to Zotero. Options: brackets (`true`(default)|`false`).",
		handler: (context: SmartblocksPlugin.CommandContext) => (brackets = true) => {
			const { item } = context.variables;
			return makeDNP(item.data.dateAdded, { brackets });
		}
	},
	"ZOTEROITEMKEY": {
		help: "Returns the citekey for a Zotero item, without the '@' prefix. If the item doesn't have a citekey, its Zotero key will be used.",
		handler: (context: SmartblocksPlugin.CommandContext) => () => {
			const { item } = context.variables;
			return item.key;
		}
	},
	"ZOTEROITEMLINK": {
		help: "Returns the link to a Zotero item (web or local library). Options: type (`local`(default)|`web`).",
		handler: (context: SmartblocksPlugin.CommandContext) => (type = "local") => {
			const { item } = context.variables;
			return type == "local"
				? getLocalLink(item, { format: "target" })
				: getWebLink(item, { format: "target" });
		}
	},
	"ZOTEROITEMMETADATA": {
		help: "Returns the formatted metadata for a Zotero item and its children (PDFs, notes/annotations), using the extension's default formatter. Use this if you want to use the default metadata template as part of your SmartBlock.",
		handler: (context: SmartblocksPlugin.CommandContext) => () => {
			const { item, pdfs, notes } = context.variables;
			const output = window.zoteroRoam.getItemMetadata(item, pdfs, notes);

			return reformatImportableBlocks(output);
		}
	},
	"ZOTEROITEMPUBLICATION": {
		help: "Returns the place of publication for a Zotero item. The command will look for the following fields, in order: `publicationTitle`, `bookTitle`, `university`. If no information is found, it will return an empty string.",
		handler: (context: SmartblocksPlugin.CommandContext) => () => {
			const { item } = context.variables;
			return item.data.publicationTitle || item.data.bookTitle || item.data.university || "";
		}
	},
	"ZOTEROITEMRELATED": {
		help: "Returns the comma-separated list of the citekeys of a Zotero item's relations, if any. Options: brackets (`true`(default)|`false`).",
		handler: (context: SmartblocksPlugin.CommandContext) => (brackets = true) => {
			const { item } = context.variables;
			return window.zoteroRoam.getItemRelated(item, { return_as: "string", brackets }) as string;
		}
	},
	"ZOTEROITEMTAGS": {
		help: "Returns the space-separated list of the tag(s) of a Zotero item, if any. Options: brackets (`true` (default)|`false`).",
		handler: (context: SmartblocksPlugin.CommandContext) => (brackets = true) => {
			const { item } = context.variables;
			return window.zoteroRoam.getItemTags(item, { return_as: "string", brackets });
		}
	},
	"ZOTEROITEMTITLE": {
		help: "Returns the title of a Zotero item.",
		handler: (context: SmartblocksPlugin.CommandContext) => () => {
			const { item } = context.variables;
			return item.data.title || "";
		}
	},
	"ZOTEROITEMTYPE": {
		help: "Returns the formatted type of a Zotero item, according to current user settings. Options: brackets (`true` (default)|`false`).",
		handler: (context: SmartblocksPlugin.CommandContext) => (brackets = true) => {
			const { item } = context.variables;
			return window.zoteroRoam.getItemType(item, { brackets });
		}
	},
	"ZOTEROITEMURL": {
		help: "Returns the URL of a Zotero item, if available. If the item has no URL but has a DOI, its DOI URL will be returned.",
		handler: (context: SmartblocksPlugin.CommandContext) => () => {
			const { item } = context.variables;
			const hasURL = item.data.url;
			const hasDOI = parseDOI(item.data.DOI);
			return hasURL || (hasDOI ? ("https://doi/org/" + hasDOI) : "");
		},
	},
	"ZOTEROITEMYEAR": {
		help: "Returns the year of publication of a Zotero item, if available.",
		handler: (context: SmartblocksPlugin.CommandContext) => () => {
			const { item } = context.variables;
			return !item.meta.parsedDate
				? ""
				: isNaN(Number(new Date(item.meta.parsedDate)))
					? ""
					: (new Date(item.meta.parsedDate)).getUTCFullYear().toString();
		}
	},
	"ZOTERONOTES": {
		help: "Formats a list of Zotero notes/annotations, with current user settings",
		handler: (context: SmartblocksPlugin.CommandContext) => () => {
			const { notes = [] } = context.variables;
			const output = window.zoteroRoam.formatNotes(notes);

			return reformatImportableBlocks(output);
		}
	},
	"ZOTEROPDFS": {
		help: "Returns the comma-separated links to a list of Zotero PDFs",
		handler: (context: SmartblocksPlugin.CommandContext) => () => {
			const { pdfs = [] } = context.variables;
			console.log(pdfs);
			return window.zoteroRoam.formatPDFs(pdfs, "string") as string;
		}
	}
} as const;

/** Returns the outcome of a given query against a given props array
 * @param query - The query to test against the props
 * @param props - The props to test the query against
 * @returns The query's outcome (`true` if the props include a string that matches the query, `false` otherwise)
 */
function processQuery(query: string, props: string[]): boolean{
	// eslint-disable-next-line no-useless-escape
	const components = query.split(/([\|\&]?)([^\&\|\(\)]+|\(.+\))([\|\&]?)/).filter(Boolean);
	if(components.includes("|")){
		return eval_or(components.filter(c => c != "|"), props);
	} else {
		return eval_and(components.filter(c => c!= "&"), props);
	}
}

/** Evaluates an "AND" query against a given props array
 * @param terms - The terms of the "AND" query 
 * @param props - The props to test the query against 
 * @returns The query's outcome (`true` if all props match the query, `false` otherwise)
 */
function eval_and(terms: string[], props: string[]): boolean{
	let outcome = true;
	for(let i=0;i<terms.length && outcome == true;i++){
		outcome = eval_term(terms[i], props);
	}
	return outcome;
}

/** Evaluates an "OR" query against a given props array
 * @param terms - The terms of the "OR" query 
 * @param props - The props to test the query against 
 * @returns The query's outcome (`true` if any of the props matches the query, `false` otherwise)
 */
function eval_or(terms: string[], props: string[]): boolean{
	let outcome = false;
	for(let i=0;i<terms.length && outcome == false;i++){
		outcome = eval_term(terms[i], props);
	}
	return outcome;
}

/** Evaluates how a query term should be handled. If the term is a (grouping), the outer parentheses are stripped and the contents are evaluated against the props array that was provided. If the term is a -negation, verify that the props *do not* include it ; otherwise, verify that the props include the term. 
 * @returns The outcome of the term's evaluation against the props
 */
function eval_term(
	/** The query term to evaluate */
	term: string,
	/** The props that are being tested */
	props: string[]
): boolean{
	if(term.startsWith("(") && term.endsWith(")")){
		const clean_str = term.slice(1, -1);
		return processQuery(clean_str, props);
	} else {
		if(term.startsWith("-")){
			const clean_str = term.slice(1);
			return !props.includes(clean_str);
		} else {
			return props.includes(term);
		}
	}
}

/** Enforces the block-object format (recursively) for an array of importable elements. This is needed for correctly importing nested blocks with SmartBlocks. */
function reformatImportableBlocks(arr: RImportableElement[]): SBImportableBlock[]{
	if(!arr){
		return [];
	} else {
		return arr.map(blck => {
			if(typeof(blck) === "string"){
				return {
					string: blck,
					text: blck,
					children: []
				};
			} else if(typeof(blck) === "object") {
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
				throw new Error(`All array items should be of type String or Object, not ${typeof(blck)}`);
			}
		});
	}
}

/* istanbul ignore next */
/** Register the extension's custom SmartBlocks commands, if the SmartBlocks extension is loaded in the user's Roam graph
 * @see https://roamjs.com/extensions/smartblocks/developer_docs
 * @see https://github.com/dvargas92495/roamjs-components/blob/7aeae1482714a4c829c8141667eb1d459403b4ec/src/util/registerSmartBlocksCommand.ts
 */
function registerSmartblockCommands(){
	const register = () => {
		if(window.roamjs?.extension?.smartblocks){
			try {
				unregisterSmartblockCommands();
			} catch(e) {
				window.zoteroRoam?.error?.({
					origin: "SmartBlocks",
					message: "Failed to unregister commands",
					context: {
						error: e.message
					}
				});
			}

			Object.keys(sbCommands).forEach(cmd => {
				const { help, handler } = sbCommands[cmd];
				window.roamjs?.extension.smartblocks?.registerCommand({
					text: cmd,
					help: help,
					handler: handler
				});
			});
		}
	};

	if (window.roamjs?.loaded?.has("smartblocks")) {
		register();
	} else {
		document.body.addEventListener("roamjs:smartblocks:loaded", register);
	}
}

/* istanbul ignore next */
/** Unregister the extension's custom SmartBlocks commands, if the SmartBlocks extension is loaded in the user's Roam graph */
function unregisterSmartblockCommands(){
	if(window.roamjs?.extension?.smartblocks){
		Object.keys(sbCommands).forEach(cmd => {
			window.roamjs?.extension?.smartblocks?.unregisterCommand(cmd);
		});
	}
}

// Extension-triggered SmartBlocks

type SBContextMetadata = {
	item: ZItemTop,
	notes: (ZItemNote | ZItemAnnotation)[],
	page: { new: boolean, title: string, uid: string },
	pdfs: ZItemAttachment[]
};

type UseSBMetadataOutcome = {
	args: {
		smartblock: SBConfig,
		uid: string
	},
	page: SBContextMetadata["page"],
	raw: Pick<SBContextMetadata, "item" | "notes" | "pdfs">
} & ({ error: null, success: true } | { error: Error, success: false });

/* istanbul ignore next */
/** Triggers a given SmartBlock to import an item's metadata
 * @param config - The configuration of the SmartBlock to use.
 * @param context - The context variables provided by the extension to the SmartBlock
 * @see https://roamjs.com/extensions/smartblocks/developer_docs
 */
async function use_smartblock_metadata(config: SBConfig, context: SBContextMetadata): Promise<UseSBMetadataOutcome>{
	const { param: sbProp, paramValue: sbPropValue } = config;
	const { item, notes, page, pdfs } = context;

	const defaultOutcome = {
		args: {
			smartblock: config,
			uid: page.uid
		},
		error: null,
		page,
		raw: {
			item,
			notes,
			pdfs
		},
		success: null
	};

	const obj = {
		targetUid: page.uid,
		variables: {},
		[sbProp]: sbPropValue
	};

	Object.keys(context).forEach(k => {
		obj.variables[k] = context[k];
	});
	
	try {
		await window.roamjs?.extension?.smartblocks?.triggerSmartblock(obj);
		return Promise.resolve({
			...defaultOutcome, 
			success: true
		});
	} catch(e){
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

export {
	eval_term,
	reformatImportableBlocks,
	registerSmartblockCommands,
	sbCommands,
	unregisterSmartblockCommands,
	use_smartblock_metadata
};
