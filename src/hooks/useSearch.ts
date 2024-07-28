import { useMemo } from "react";

import { searchEngine } from "../utils";

import { AsBoolean } from "Types/helpers";


// TODO: create helpers for configuring filters with common patterns (multiple values, ranges, AND/OR like I did with Smartblocks queries)

type Preset = {
	/** The user-facing label for the preset. This is used in suggestions. */
	label: string,
	/** The value for the preset. This is used in the query itself. */
	value: string
}

export type Filter<T extends Record<string, any> = Record<string, any>> = {
	/** The user-facing label for the filter. This is used in suggestions. */
	label: string,
	/** The filter's operator. This is used in the query itself. */
	value: string,
	/** The fixed suggestions to present when the user selects the filter. */
	presets: Preset[],
	evaluate: (query: string, item: T) => boolean
}


const QUALIFIED_FILTER_REGEX = new RegExp(/([^ ]+:(?:[^ "]+|"[^:]+")(?: *))/g);

const useSearchFilters = (
	{ query, cursorPosition, filters }: { query: string, cursorPosition: number, filters: Filter[] }
) => {
	// Split the query string into sequential terms.
	// A term is either a fully qualified filter or an unmatched group.
	const terms = useMemo(() => query.split(QUALIFIED_FILTER_REGEX).filter(Boolean), [query]);

	const currentPositionDetails = useMemo(() => {
		let currentTerm = "";
		let posWithinTerm = 0;
	
		let remainingIter = cursorPosition;
	
		for (const term of terms) {
			if (remainingIter <= term.length) {
				currentTerm = term;
				posWithinTerm = remainingIter;
				break;
			}
	
			remainingIter -= term.length;
		}

		return { term: currentTerm, position: posWithinTerm };
	}, [terms, cursorPosition]);

	const suggestions = useMemo<Preset[]|Filter[]>(() => {
		const { term, position } = currentPositionDetails;

		if (position == 0) {
			return [];
		}

		// operator:|
		if (term.endsWith(":") && position == term.length) {
			const operator = term.slice(0, position - 1);
			const maybeFilter = filters.find(({ value }) => value == operator);

			if (maybeFilter) {
				return maybeFilter.presets;
			} else {
				return [];
			}
		}

		// operator:quer
		if (term.includes(":")) {
			return []
		}

		// tex|, op|, ...
		// TODO: improve the filtering here
		return filters.filter(({ value }) => value.startsWith(term));

	}, [currentPositionDetails, filters]);

	return {
		suggestions,
		term: currentPositionDetails.term,
		position: currentPositionDetails.position,
		terms
	}
};


type SearchFreeText = string;
type SearchFilter<T extends Record<string,any> = Record<string, any>> = { filter: Filter<T>, query: string };
type SearchTerm<T extends Record<string, any> = Record<string, any>> = SearchFreeText | SearchFilter<T>;

const runSearch = <T extends Record<string, any> = Record<string, any>>(
	terms: SearchTerm<T>[], items: T[], search_field: keyof T | undefined
) => {
	return terms.reduce((filteredItems, term) => {
		// Free-text
		if (typeof term === "string") {
			// If no searchable field was provided, ignore free-text input
			if (!search_field) {
				return filteredItems;
			}

			return filteredItems.filter(item => searchEngine(term, item[search_field]));
		}

		// Filters
		return filteredItems.filter(item => term.filter.evaluate(term.query, item));
	}, items)
};

/** Multi-word queries are supported by surrounding the terms with `""` (double quotes). Trailing spaces are trimmed. */
const FILTER_REGEX = new RegExp(/([^ ]+):([^ "]+|"[^:]+")(?: *)/g);

const useSearch = <T extends Record<string, any> = Record<string, any>>(
	{ query, filters, items, search_field = undefined }: { query: string, filters: Filter[], items: T[], search_field?: keyof T }
) => {
	const terms = useMemo<SearchTerm[]>(() => {
		const matches = Array.from(query.matchAll(FILTER_REGEX));
		const appliedFilters: SearchFilter[] = matches
			.map((match) => {
				const [/* string */, operator, query] = match;
				
				let cleanQuery = query;
				if (cleanQuery.startsWith(`"`)) {
					cleanQuery = cleanQuery.slice(1);
				}
				if (cleanQuery.endsWith(`"`)) {
					cleanQuery = cleanQuery.slice(0, -1);
				}
		
				return { operator, query: cleanQuery };
			})
			.map(({ operator, query }) => {
				const maybeFilter = filters.find(({ value }) => value == operator);

				if (maybeFilter) {
					return { filter: maybeFilter, query }
				}

				return null
			})
			.filter(AsBoolean)
		;

		const freeTextSearch = query.replaceAll(FILTER_REGEX, "");
		let cleanFreeTextSearch = freeTextSearch;
		if (cleanFreeTextSearch.startsWith(`"`)) {
			cleanFreeTextSearch = cleanFreeTextSearch.slice(1);
		}
		if (cleanFreeTextSearch.endsWith(`"`)) {
			cleanFreeTextSearch = cleanFreeTextSearch.slice(0, -1);
		}

		return [...appliedFilters, freeTextSearch]

	}, [query, filters]);

	const matchedItems = useMemo(() => runSearch(terms, items, search_field), [terms, items, search_field]);
	
	return matchedItems;
};

export { useSearch, useSearchFilters };