import { SearchTerm } from "./types";

import { searchEngine } from "../../utils";


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

export { runSearch };