import { QueryFilter } from "@hooks";

import { searchEngine } from "../../../../utils";
import { ZCleanItemPDF } from "Types/transforms";

export const pdfFilters: QueryFilter<ZCleanItemPDF>[] = [
	{
		label: "Has annotations",
		value: "hasAnnotations",
		presets: [
			{ label: "Yes", value: "true" },
			{ label: "No", value: "false" },
		],
		evaluate: (query, item) => {
			const boolCheck = query === "true" ? true : false;
			return (item.annotations.length > 0) === boolCheck;
		}
	},
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