import { FilterTerm, QueryFilter, SearchSuggestion, SearchTerm } from "./types";

import { searchEngine } from "../../utils";
import { AsBoolean } from "Types/helpers";


// TODO: create helpers for configuring filters with common patterns (multiple values, ranges, AND/OR like I did with Smartblocks queries)

const FILTER_REGEX = new RegExp(/^(?: *)([^ ]+):([^ "]+|"[^:]+")(?: *)$/);
const INCOMPLETE_FILTER_REGEX = new RegExp(/^[^ ]+:(?:"[^"]*)?$/g);
const INCOMPLETE_FREE_TEXT_REGEX = new RegExp(/^("[^"]*)$/g);
const QUALIFIED_FILTER_REGEX = new RegExp(/([^ ]+:(?:[^ "]+|"[^:]+")(?: *))/g);

type CursorPosition = {
	position: number,
	term: string,
	termIndex: number
};

/** Determines which term to consider the cursor to be located in. */
const computeCursorPosition = (
	/** The ordered list of the query's components. */
	terms: string[],
	/** The cursor's position relative to the entire query string. */
	cursorPosition: number
): CursorPosition => {
	let remainingIter = cursorPosition;

	for (let i = 0; i < terms.length; i++) {
		const term = terms[i];
		const termFullyContainsCursor = remainingIter < term.length;
		const cursorIsTerminal = remainingIter == term.length;
		const isLastTerm = i == terms.length - 1;

		if (termFullyContainsCursor || (cursorIsTerminal && (isLastTerm || (isIncompleteFilter(term) || isIncompleteFreeText(term))))) {
			return {
				position: remainingIter,
				term,
				termIndex: i
			}
		}

		remainingIter -= term.length;
	}

	throw new Error("Cursor position could not be determined");
};


type ComputeSuggestionsArgs<T extends Record<string, any> = Record<string, any>> = {
	filters: QueryFilter<T>[],
	position: number,
	term: string
};

/** Determines which suggestions to make for the current query string, cursor position, and filters. */
const computeSuggestions = <T extends Record<string, any> = Record<string, any>>(
	{ filters, position, term }: ComputeSuggestionsArgs<T>
): SearchSuggestion<T>[] => {
	if (term.length == 0) return filters;
	if (position == 0) return [];

	// operator:|
	if (term.endsWith(":") && position == term.length && isIncompleteFilter(term)) {
		return filters.find(({ value }) => value == term.slice(0, -1))?.presets || [];
	}

	// operator:tex|, operator:text |, "free tex
	if (term.includes(":") || isIncompleteFreeText(term)) {
		return []
	}

	// tex|, op|, ...
	return filters.filter(({ value, label }) => searchEngine(term, [value, label], { word_order: "loose" }));
};


/** Determines if a term is a partially qualified filter (e.g. operator:). */
const isIncompleteFilter = (term: string) => {
	return term.match(INCOMPLETE_FILTER_REGEX) !== null;
};


/** Determines if a term is an unclosed quoted free-text string (e.g. "free tex). */
const isIncompleteFreeText = (term: string) => {
	return term.match(INCOMPLETE_FREE_TEXT_REGEX) !== null;
};


/** Splits a full query string into term components.
 * A term is either a fully qualified filter or an unmatched group (which could be free-text search or a partially-typed filter).
 * If the query is empty or ends with a space, an empty term is appended to the list of components to correctly determine suggestions when the cursor is at the end of the query.
*/
const parseQueryTerms = (query: string) => {
	const chunks = query.split(QUALIFIED_FILTER_REGEX).filter(Boolean);

	return (chunks.length === 0 || chunks[chunks.length -1].endsWith(" "))
		? [...chunks, ""]
		: chunks;
};


/** Extracts valid filters and free-text search elements from a list of query terms.
 * Invalid filters are removed. Free-text search is evaluated last, after any filters.
*/
const parseSearchTerms = <T extends Record<string, any> = Record<string, any>>(terms: string[], filters: QueryFilter<T>[]) => {
	let freeTextTerms: string[] = [];
	let filterTerms: FilterTerm<T>[] = [];

	terms.forEach(term => {
		const filterMatch = term.match(FILTER_REGEX);

		if (!filterMatch) {
			let cleanFreeTextSearch = term;
			if (cleanFreeTextSearch.startsWith(`"`)) {
				cleanFreeTextSearch = cleanFreeTextSearch.slice(1);
			}
			if (cleanFreeTextSearch.endsWith(`"`)) {
				cleanFreeTextSearch = cleanFreeTextSearch.slice(0, -1);
			}

			freeTextTerms.push(cleanFreeTextSearch);
			return;
		};

		const [/* string */, operator, query] = filterMatch;
		const validFilter = filters.find(({ value }) => value == operator);

		if (validFilter) {
			let cleanQuery = query;
			if (cleanQuery.startsWith(`"`)) {
				cleanQuery = cleanQuery.slice(1);
			}
			if (cleanQuery.endsWith(`"`)) {
				cleanQuery = cleanQuery.slice(0, -1);
			}
		
			filterTerms.push({ filter: validFilter, query: cleanQuery });
		}
	})

	return [...filterTerms, freeTextTerms.join("")];
};


/** Executes an ordered set of query terms against a list of items. */
const runSearch = <T extends Record<string, any> = Record<string, any>>(
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


export {
	computeCursorPosition,
	computeSuggestions,
	isIncompleteFilter,
	isIncompleteFreeText,
	parseQueryTerms,
	parseSearchTerms,
	runSearch
};