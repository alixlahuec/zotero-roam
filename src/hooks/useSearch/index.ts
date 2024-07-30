import { useCallback, useMemo } from "react";

import { computeCursorPosition, parseQueryTerms, runSearch } from "./helpers";
import { FilterTerm, QueryFilter, SearchSuggestion, SearchTerm } from "./types";

import { AsBoolean } from "Types/helpers";


const FILTER_REGEX = new RegExp(/([^ ]+):([^ "]+|"[^:]+")(?: *)/g);

type UseSearchProps<T extends Record<string, any> = Record<string, any>> = {
	cursorPosition: number,
	filters: QueryFilter<T>[],
	handleQueryChange: (query: string) => void,
	query: string
};

const useSearchFilters = <T extends Record<string, any> = Record<string ,any>>(
	{ cursorPosition, filters, handleQueryChange, query }: UseSearchProps<T>
) => {
	const terms = useMemo(() => parseQueryTerms(query), [query]);

	const currentPositionDetails = useMemo(() => computeCursorPosition(terms, cursorPosition), [terms, cursorPosition]);

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
		 */
		terms
	}
};


const useSearch = <T extends Record<string, any> = Record<string, any>>(
	{ query, filters, items, search_field = undefined }: { query: string, filters: QueryFilter[], items: T[], search_field?: keyof T }
) => {
	const terms = useMemo<SearchTerm[]>(() => {
		const matches = Array.from(query.matchAll(FILTER_REGEX));
		const appliedFilters: FilterTerm[] = matches
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


export * from "./types";

export { useSearch, useSearchFilters };