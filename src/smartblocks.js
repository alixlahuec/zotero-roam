
/** Generates the list of custom SmartBlocks commands to register
 * @param {function} getItems - The exposed utility that returns available Zotero items. See {@link App} component.
 * @returns {Object} The list of commands to register
 */
const sbCommands = (getItems) => {
	return {
		"ZOTERORANDOMCITEKEY": {
			help: "Return one or more Zotero citekeys, with optional tag query",
			handler: (_context) => (nb = "1", query="") => {
				return getItems("items")
					.filter(it => processQuery(query, it.data.tags.map(t => t.tag)))
					.map(it => "@" + it.key)
					.sort(() => 0.5 - Math.random())
					.slice(0, Number(nb) || 1);
			}
		}
	};
};

/** Returns the outcome of a given query against a given props array
 * @param {String} query - The query to test against the props
 * @param {String[]} props - The props to test the query against
 * @returns {Boolean} The query's outcome (`true` if the props include a string that matches the query, `false` otherwise)
 */
function processQuery(query, props){
	// eslint-disable-next-line no-useless-escape
	let components = query.split(/([\|\&]?)([^\&\|\(\)]+|\(.+\))([\|\&]?)/).filter(Boolean);
	if(components.includes("|")){
		return eval_or(components.filter(c => c != "|"), props);
	} else {
		return eval_and(components.filter(c => c!= "&"), props);
	}
}

/** Evaluates an "AND" query against a given props array
 * @param {String[]} terms - The terms of the "AND" query 
 * @param {String[]} props - The props to test the query against 
 * @returns {Boolean} The query's outcome (`true` if all props match the query, `false` otherwise)
 */
function eval_and(terms, props){
	let outcome = true;
	for(let i=0;i<terms.length && outcome == true;i++){
		outcome = eval_term(terms[i], props);
	}
	return outcome;
}

/** Evaluates an "OR" query against a given props array
 * @param {String[]} terms - The terms of the "OR" query 
 * @param {String[]} props - The props to test the query against 
 * @returns {Boolean} The query's outcome (`true` if any of the props matches the query, `false` otherwise)
 */
function eval_or(terms, props){
	let outcome = false;
	for(let i=0;i<terms.length && outcome == false;i++){
		outcome = eval_term(terms[i], props);
	}
	return outcome;
}

/** Evaluates how a query term should be handled. If the term is a (grouping), the outer parentheses are stripped and the contents are evaluated against the props array that was provided. If the term is a -negation, verify that the props *do not* include it ; otherwise, verify that the props include the term.
 * @param {String} term - The query term to evaluate 
 * @param {*} props - The props that are being tested
 * @returns {Boolean} The outcome of the term's evaluation against the props
 */
function eval_term(term, props){
	if(term.startsWith("(") && term.endsWith(")")){
		let clean_str = term.slice(1, -1);
		return processQuery(clean_str, props);
	} else {
		if(term.startsWith("-")){
			let clean_str = term.slice(1);
			return !props.includes(clean_str);
		} else {
			return props.includes(term);
		}
	}
}

/** Register the extension's custom SmartBlocks commands, if the SmartBlocks extension is loaded in the user's Roam graph
 */
function registerSmartblockCommands(getItems){
	const commands = sbCommands(getItems);
	Object.keys(commands).forEach(k => {
		let {help, handler} = commands[k];
		window.roamjs?.extension?.smartblocks?.registerCommand({
			text: k,
			help: help,
			handler: handler
		});
	});
}

// Extension-triggered SmartBlocks

/** Triggers a given SmartBlock to import an item's metadata
 * @param {*} config 
 * @param {*} context
 * @returns {Promise} If successful, `{success:true}` - otherwise an object containing the error encountered and the arguments with which the function was called.
 */
async function use_smartblock_metadata(config, context){
	let obj = config;
	obj.targetUid = context.uid;
	if(!obj.variables){ obj.variables = {}; }
	Object.keys(context).forEach(k => {
		obj.variables[`${k}`] = context[`${k}`];
	});
	try {
		await window.roamjs?.extension?.smartblocks?.triggerSmartblock(obj);
		Promise.resolve({ success: true });
	} catch(e){
		console.error(e);
		Promise.reject({ success: false, error: e, details: {config, context, obj } });
	}
}

export {
	registerSmartblockCommands,
	use_smartblock_metadata
};
