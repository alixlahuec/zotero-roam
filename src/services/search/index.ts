import { AsBoolean } from "Types/helpers";
import { EvaluateFn, FilterFn } from "./useSearchQuery";
import { equalsBoolean, parseDateInThePast, parseDateRangeInThePast } from "./helpers";


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


/**
 * Helper to construct boolean query filters.
 * @param cb A callback that returns the value to compare to a Boolean.
 * @example
 * ```
 * const myFilter = {
 * 	...,
 * 	evaluate: evaluateBoolean(item => item.abstract)
 * }
 * ```
 */
const evaluateBoolean = <T extends Record<string, any> = Record<string, any>>(cb: (item: T) => any): EvaluateFn<T> => {
	return (query: string, item: T) => equalsBoolean(query, cb(item))
}


/**
 * Helper to construct date filters.
 * @param cb A callback that returns the value to compare to the date/date range from the query.
 * @param opts Additional filter options.
 * @example
 * ```
 * const myFilter = {
 * 	...,
 * 	filter: filterWithPastDate(item => item.data.dateAdded)
 * }
 * ```
 * @example With date range:
 * ```
 * const myFilter = {
 * 	...,
 * 	filter: filterWithPastDate(item => item.data.dateAdded, { compare: "between" })
 * }
 * ```
 */
const filterWithPastDate = <T extends Record<string, any> = Record<string, any>>(cb: (item: T) => Date, { compare = "before" }: { compare?: "before" | "after" | "between" }): FilterFn<T> => {
	return (query: string, items: T[]) => {
		switch (compare) {
			case "between": {
				const queryDate = parseDateRangeInThePast(query);
				if (queryDate === null) return items
				const [start, end] = queryDate;
				return items.filter(i => {
					const refDate = cb(i);
					return start < refDate && refDate > end;
				});
			}
			case "after": {
				const queryDate = parseDateInThePast(query);
				if (queryDate === null) return items
				return items.filter(i => cb(i) > queryDate);
			}
			case "before":
			default: {
				const queryDate = parseDateInThePast(query);
				if (queryDate === null) return items
				return items.filter(i => cb(i) < queryDate);
			}
		}
	}
}


/**
 * Helper to construct complex search query filters.
 * @param cb The predicate to use for checking a query term against an item. This has the same signature as `evaluate`.
 * @example
 * ```
 * const myFilter = {
 * 	...,
 * 	filter: filterWithQuery((term, item) => item.data.tags.includes(term))
 * }
 * ```
 */
const filterWithQuery = <T extends Record<string, any> = Record<string, any>>(cb: EvaluateFn<T>): FilterFn<T> => {
	return (query: string, items: T[]) => {
		const matcher = new Query(query);
		return items.filter((i) => matcher.match((q) => cb(q, i)));
	}
}

export { Query, evaluateBoolean, filterWithPastDate, filterWithQuery };
export * from "./useSearchQuery";
