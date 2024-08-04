import { QueryFilter } from "@hooks";

import { searchEngine } from "../../../../utils";
import { ZCleanItemPDF } from "Types/transforms";

export const pdfFilters: QueryFilter<ZCleanItemPDF>[] = [
	{
		label: "Tags include",
		value: "tags",
		presets: [],
		evaluate: (query, item) => {
			// TODO: support complex matching (AND/OR, negative)
			return searchEngine(query, item.tags, { match: "exact" });
		}
	}
];