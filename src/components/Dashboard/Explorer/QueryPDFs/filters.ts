import { QueryFilter } from "@services/search";

import { searchEngine } from "../../../../utils";
import { ZCleanItemPDF } from "Types/transforms";
import { evaluateBoolean, filterWithQuery } from "@services/search";

export const pdfFilters: QueryFilter<ZCleanItemPDF>[] = [
	{
		label: "Has annotations",
		value: "hasAnnotations",
		presets: [
			{ label: "Yes", value: "true" },
			{ label: "No", value: "false" },
		],
		evaluate: evaluateBoolean(item => item.annotations.length > 0)
	},
	{
		label: "Tags include",
		value: "tags",
		presets: [],
		filter: filterWithQuery((term, item) => item.tags.includes(term))
	}
];