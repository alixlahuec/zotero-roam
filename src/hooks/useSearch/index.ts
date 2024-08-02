import { useCallback, useMemo } from "react";

import { computeCursorPosition, computeSuggestions, parseQueryTerms, parseSearchTerms, runSearch } from "./helpers";
import { QueryFilter, SearchSuggestion } from "./types";


type UseSearchProps<T extends Record<string, any> = Record<string, any>> = {
	cursorPosition: number,
	filters: QueryFilter<T>[],
	handleQueryChange: (query: string) => void,
	query: string,
	search_field?: keyof T,
	setCursorPosition: (pos: number) => void
};

const useSearchFilters = <T extends Record<string, any> = Record<string ,any>>(
	{ cursorPosition, filters, handleQueryChange, query, search_field, setCursorPosition }: UseSearchProps<T>
) => {
	const terms = useMemo(() => parseQueryTerms(query), [query]);

	const currentPositionDetails = useMemo(() => computeCursorPosition(terms, cursorPosition), [terms, cursorPosition]);

	const suggestions = useMemo(() => {
		const { term, position } = currentPositionDetails;
		return computeSuggestions<T>({ filters, position, term });
	}, [currentPositionDetails, filters]);

	const applySuggestion = useCallback((suggestion: SearchSuggestion<T>) => {
		const { term, termIndex } = currentPositionDetails;

		const isOperatorCompletion = !term.includes(":");
		const updatedFilter = isOperatorCompletion
			? suggestion.value + ":"
			: (term.split(":")[0] + ":" + suggestion.value);

		const termsList = terms;
		termsList[termIndex] = updatedFilter;

		const newCursorPosition = termsList.map(term => term.length).filter((_term, index) => index <= termIndex).reduce((iter, termLength) => iter + termLength, 0);

		handleQueryChange(termsList.join(""));
		setCursorPosition(newCursorPosition);
	}, [currentPositionDetails, handleQueryChange, setCursorPosition]);

	const search = useCallback((items) => {
		const searchTerms = parseSearchTerms(terms, filters);
		return runSearch(searchTerms, items, search_field);
	}, [filters, search_field, terms]);

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
		 * A contextual handler that executes the query against a list of items.
		 */
		search,
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


export * from "./types";

export { useSearchFilters };