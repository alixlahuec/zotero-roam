import { SearchTerm } from "./types";

import { searchEngine } from "../../utils";


// TODO: create helpers for configuring filters with common patterns (multiple values, ranges, AND/OR like I did with Smartblocks queries)

const INCOMPLETE_FILTER_REGEX = new RegExp(/^[^ ]+:(?:"[^"]*)?$/g);
const INCOMPLETE_FREE_TEXT_REGEX = new RegExp(/^("[^"]+)|([^": ]+)$/g);
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
		const isPenultimateTerm = i == terms.length - 2;
		const isIncompleteFilter = term.match(INCOMPLETE_FILTER_REGEX) !== null;
		const isIncompleteQuotedFreeText = term.match(INCOMPLETE_FREE_TEXT_REGEX) !== null;

		if (termFullyContainsCursor || (cursorIsTerminal && (isLastTerm || (isPenultimateTerm && (isIncompleteFilter || isIncompleteQuotedFreeText))))) {
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


/** Splits a full query string into term components.
 * A term is either a fully qualified filter or an unmatched group (which could be free-text search or a partially-typed filter).
 * Note that the last term is always an empty string, which is needed to correctly determine suggestions when the cursor is at the end of the query.
*/
const parseQueryTerms = (query: string) => {
	return [...query.split(QUALIFIED_FILTER_REGEX).filter(Boolean), ""]
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


export { computeCursorPosition, parseQueryTerms, runSearch };