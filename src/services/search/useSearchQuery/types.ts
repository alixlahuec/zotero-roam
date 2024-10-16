type Preset = {
	/** The user-facing label for the preset. This is used in suggestions. */
	label: string,
	/** The value for the preset. This is used in the query itself. */
	value: string
}

type BaseQueryFilter = {
	/** The user-facing label for the filter. This is used in suggestions. */
	label: string,
	/** The filter's operator. This is used in the query itself. */
	value: string,
	/** The fixed suggestions to present when the user selects the filter. */
	presets: Preset[]
}

export type EvaluateFn<T extends Record<string, any> = Record<string, any>> = (query: string, item: T) => boolean;
export type FilterFn<T extends Record<string, any> = Record<string, any>> = (query: string, items: T[]) => T[];

type QueryFilterWithEvaluate<T extends Record<string, any> = Record<string, any>> = BaseQueryFilter & {
	/** The predicate to apply against an item. */
	evaluate: EvaluateFn<T>
}

type QueryFilterWithFilter<T extends Record<string, any> = Record<string, any>> = BaseQueryFilter & {
	/** The filtering logic to apply against the list of items. */
	filter: FilterFn<T>
}

export type QueryFilter<T extends Record<string, any> = Record<string, any>> = QueryFilterWithEvaluate<T> | QueryFilterWithFilter<T>

export const filterHasEvaluate = (filter: QueryFilter): filter is QueryFilterWithEvaluate => "evaluate" in filter

export type FilterTerm<T extends Record<string, any> = Record<string, any>> = {
	/** The configuration for the filter. */
	filter: QueryFilter<T>,
	/** The query string for the filter. */
	query: string
};

type FreeTextTerm = string;
export type SearchTerm<T extends Record<string, any> = Record<string, any>> = FreeTextTerm | FilterTerm<T>;

export type SearchSuggestion<T extends Record<string, any> = Record<string, any>> = Preset | QueryFilter<T>;
