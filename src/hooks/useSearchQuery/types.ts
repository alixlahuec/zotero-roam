type Preset = {
	/** The user-facing label for the preset. This is used in suggestions. */
	label: string,
	/** The value for the preset. This is used in the query itself. */
	value: string
}

export type QueryFilter<T extends Record<string, any> = Record<string, any>> = {
	/** The user-facing label for the filter. This is used in suggestions. */
	label: string,
	/** The filter's operator. This is used in the query itself. */
	value: string,
	/** The fixed suggestions to present when the user selects the filter. */
	presets: Preset[],
	/** The predicate to apply against an item. */
	evaluate: (query: string, item: T) => boolean
}

export type FilterTerm<T extends Record<string, any> = Record<string, any>> = {
	/** The configuration for the filter. */
	filter: QueryFilter<T>,
	/** The query string for the filter. */
	query: string
};

type FreeTextTerm = string;
export type SearchTerm<T extends Record<string, any> = Record<string, any>> = FreeTextTerm | FilterTerm<T>;

export type SearchSuggestion<T extends Record<string, any> = Record<string, any>> = Preset | QueryFilter<T>;
