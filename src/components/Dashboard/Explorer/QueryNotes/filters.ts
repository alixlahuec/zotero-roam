import { filterWithQuery, QueryFilter } from "@services/search";

import { searchEngine } from "../../../../utils";
import { ZItemAnnotation, ZItemNote } from "Types/transforms";

export const noteFilters: QueryFilter<ZItemAnnotation | ZItemNote>[] = [
	{
		label: "Tags include",
		value: "tags",
		presets: [],
		filter: filterWithQuery((term, item) => item.data.tags.map(t => t.tag).includes(term))
	}
];