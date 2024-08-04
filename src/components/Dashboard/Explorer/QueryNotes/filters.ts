import { QueryFilter } from "@hooks";

import { searchEngine } from "../../../../utils";
import { isZAnnotation, ZItemAnnotation, ZItemNote } from "Types/transforms";

export const noteFilters: QueryFilter<ZItemAnnotation | ZItemNote>[] = [
	{
		label: "Tags include",
		value: "tags",
		presets: [],
		evaluate: (query, item) => {
			// TODO: support complex matching (AND/OR, negative)
			return isZAnnotation(item)
				? searchEngine(query, item.data.tags.map(t => t.tag), { match: "exact" })
				: false;
		}
	}
];