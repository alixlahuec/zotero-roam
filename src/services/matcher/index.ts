import { AsBoolean } from "Types/helpers";


type Predicate = (query: string) => boolean

/** Helper class to evaluate simple to complex filtering queries against an item. */
export default class Matcher {
	predicate: Predicate

	constructor(predicate: Predicate) {
		this.predicate = predicate;
	}

	/** Evaluates a query. */
	run(query: string): boolean {
		if (query.startsWith("-")) {
			return !this.run(query.slice(1))
		}

		// eslint-disable-next-line no-useless-escape
		const components = query.split(/([\|\&]?)([^\&\|\(\)]+|\(.+\))([\|\&]?)/).filter(AsBoolean);

		if (components.includes("|")) {
			return this._or(components.filter(c => c != "|"));
		} else {
			return this._and(components.filter(c => c != "&"));
		}
	}

	/** Evaluates an ordered sequence of filtering terms in "AND" mode.
	 * This will exit as soon as a negative result is returned.
	*/
	_and(terms: string[]): boolean {
		let outcome = true;
		for (let i = 0; i < terms.length && outcome == true; i++) {
			outcome = this._match(terms[i]);
		}
		return outcome;
	}

	/** Evaluates an ordered sequence of filtering terms against the target in "OR" mode.
	 * This will exit as soon as a positive result is returned.
	*/
	_or(terms: string[]): boolean {
		let outcome = false;
		for (let i = 0; i < terms.length && outcome == false; i++) {
			outcome = this._match(terms[i]);
		}
		return outcome;
	}

	/** Evaluates a filtering term against the target. This can be a single filter or a joined filter. */
	_match(term: string): boolean {
		if (term.startsWith("(") && term.endsWith(")")) {
			return this.run(term.slice(1, -1));
		} else {
			if (term.startsWith("-")) {
				return !this._match(term.slice(1))
			} else {
				return this.predicate(term)
			}
		}
	}
}

type ParsedComponents = {
	operator: "AND" | "OR"
	reverse: boolean
	terms: (string | ParsingResult)[]
}

type ParsingResult = {
	input: string
	parsedComponents: ParsedComponents
}

class StableMatcher{
	query: string
	queryTree: ParsingResult

	constructor(query: string) {
		this.query = query
		this.queryTree = this.tree()
	}

	tree(): ParsingResult {
		return (this.queryTree || this._parse(this.query))
	}

	/** Parses an input string. */
	_parse(input: string): ParsingResult {
		let cleanStr = input;
		let reverse = false;

		if (input.startsWith("-")) {
			cleanStr = cleanStr.slice(1)
			reverse = true
		}

		const components = cleanStr.split(/-?([^&|()]+|\((?:-?(?:[^&|()]+|(?:\([^()]+\)))(?:[&|])?)+\))([&|])?/).filter(AsBoolean);

		if (components.includes("|")) {
			return {
				input,
				parsedComponents: {
					operator: "OR",
					reverse,
					terms: components.filter(c => c != "|").map(c => this._unwrap(c))
				}
			};
		} else {
			return {
				input,
				parsedComponents: {
					operator: "AND",
					reverse,
					terms: components.filter(c => c != "&").map(c => this._unwrap(c))
				}
			};
		}
	}

	_unwrap(input: string): ParsingResult | string {
		if (input.startsWith("(") && input.endsWith(")")) {
			return this._parse(input.slice(1, -1));
		} else if(input.startsWith("-")) {
			return this._parse(input)
		} else {
			return input
		}
	}

	match(predicate: Predicate): boolean {
		return this._check(this.queryTree.parsedComponents, predicate)
	}

	_check(components: ParsedComponents, predicate: Predicate): boolean{
		const { operator, reverse = false, terms } = components;

		if (operator == "AND") {
			let outcome = true;
			for (let i = 0; i < terms.length && outcome == true; i++){
				outcome = this._eval(terms[i], predicate)
			}

			return reverse ? !outcome : outcome

		} else {
			let outcome = false;
			for (let i = 0; i < terms.length && outcome == false; i++){
				outcome = this._eval(terms[i], predicate)
			}

			return reverse ? !outcome : outcome

		}
	}

	_eval(term: ParsingResult | string, predicate: Predicate): boolean{
		return (typeof (term) === "string")
			? predicate(term)
			: this._check(term.parsedComponents, predicate)
	}

}

export { StableMatcher };
