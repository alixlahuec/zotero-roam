import { AsBoolean } from "Types/helpers";


type Predicate = (query: string) => boolean

type ParsedComponents = {
	operator: "AND" | "OR"
	reverse: boolean
	terms: (string | ParsingResult)[]
}

type ParsingResult = {
	input: string
	parsedComponents: ParsedComponents
}

class Query{
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

export { Query };
