import { useCallback, useMemo } from "react";

import { searchEngine } from "../utils";

import { AsBoolean } from "Types/helpers";


// TODO: create helpers for configuring filters with common patterns (multiple values, ranges, AND/OR like I did with Smartblocks queries)

type CursorPosition = {
	position: number,
	term: string,
	termIndex: number
};

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

export type SearchSuggestion<T extends Record<string, any> = Record<string, any>> = Preset | Filter<T>;


const FILTER_REGEX = new RegExp(/([^ ]+):([^ "]+|"[^:]+")(?: *)/g);
const QUALIFIED_FILTER_REGEX = new RegExp(/([^ ]+:(?:[^ "]+|"[^:]+")(?: *))/g);
const QUALIFIED_FILTER_WITH_TRAILING_SPACE_REGEX = new RegExp(/^[^ ]+:(?:[^ "]+|"[^:]+") $/g);

type UseSearchProps<T extends Record<string, any> = Record<string, any>> = {
	cursorPosition: number,
	filters: Filter<T>[],
	handleQueryChange: (query: string) => void,
	query: string
};

const useSearchFilters = <T extends Record<string, any> = Record<string ,any>>(
	{ cursorPosition, filters, handleQueryChange, query }: UseSearchProps<T>
) => {
	const terms = useMemo(() => [...query.split(QUALIFIED_FILTER_REGEX).filter(Boolean), ""], [query]);

	const currentPositionDetails = useMemo<CursorPosition>(() => {
		let remainingIter = cursorPosition;
	
		for (let i = 0; i < terms.length; i++){
			const term = terms[i];
			const termFullyContainsCursor = remainingIter < term.length;
			const cursorIsTerminal = remainingIter == term.length;
			const isLastTerm = i == terms.length - 1;
			const isFullyQualifiedFilter = term.match(QUALIFIED_FILTER_WITH_TRAILING_SPACE_REGEX) !== null;

			if (termFullyContainsCursor || (cursorIsTerminal && (isLastTerm || !isFullyQualifiedFilter))) {
				return {
					position: remainingIter,
					term,
					termIndex: i
				}
			}

			remainingIter -= term.length;
		}

		throw new Error("Cursor position could not be determined");
	}, [terms, cursorPosition]);

	const suggestions = useMemo<SearchSuggestion<T>[]>(() => {
		const { term, position } = currentPositionDetails;

		if (position == 0) {
			return term.length == 0
				? filters
				: [];
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

	const applySuggestion = useCallback((suggestion: SearchSuggestion<T>) => {
		const { term, termIndex } = currentPositionDetails;

		const isOperatorCompletion = !term.includes(":");
		const updatedFilter = isOperatorCompletion
			? suggestion.value + ":"
			: (term.split(":")[0] + ":" + suggestion.value);

		const termsList = terms;
		termsList[termIndex] = updatedFilter;

		handleQueryChange(termsList.join(""));
	}, [currentPositionDetails, handleQueryChange]);

	return {
		/**
		 * A contextual handler that updates the query string from a suggestion.
		 */
		applySuggestion,
		/**
		 * The current position of the cursor, relative to the `term`.
		*/
		position: currentPositionDetails.position,
		/**
		 * All available suggestions for the current filtering context.
		 */
		suggestions,
		/**
		 * The current term within which the cursor is located.
		 */
		term: currentPositionDetails.term,
		/**
		 * The index of the current `term`, relative to the list of `terms`.
		 */
		termIndex: currentPositionDetails.termIndex,
		/**
		 * The ordered sequence of components to the query.
		 * A term is either a fully qualified filter or an unmatched group (which could be free-text search or a partially-typed filter).
		 * Note that the last term is always an empty string, which is needed to correctly determine suggestions when the cursor is at the end of the query.
		 */
		terms
	}
};


type SearchFreeText = string;
type SearchFilter<T extends Record<string,any> = Record<string, any>> = { filter: Filter<T>, query: string };
type SearchTerm<T extends Record<string, any> = Record<string, any>> = SearchFreeText | SearchFilter<T>;

export const runSearch = <T extends Record<string, any> = Record<string, any>>(
	terms: SearchTerm<T>[], items: T[], search_field: keyof T | undefined
) => {
	return terms.reduce((filteredItems, term) => {
		// Skip falsy terms
		// This is needed to ignore empty queries and the trailing term for non-empty queries
		if (!term) {
			return filteredItems;
		}

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