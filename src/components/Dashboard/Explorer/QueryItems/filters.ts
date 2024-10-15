import { useMemo } from "react";

import { useTypemapSettings } from "Components/UserSettings";

import { QueryFilter, evaluateBoolean, filterWithPastDate, filterWithQuery } from "@services/search";

import { searchEngine } from "../../../../utils";
import { parseDateInThePast, parseDateRangeInThePast } from "../helpers";
import { ZCleanItemTop } from "Types/transforms";


/** Custom hook for returning query search filters for top-level Zotero items. */
const useItemFilters = () => {
	const [typemap] = useTypemapSettings();

	const filters = useMemo<QueryFilter<ZCleanItemTop>[]>(() => [
		{
			label: "Abstract matches",
			value: "abstract",
			presets: [],
			evaluate: (query, item) => {
				if (!item.abstract) return false;
				return searchEngine(query, item.abstract, { word_order: "loose" });
			}
		},
		{
			label: "Abstract exists",
			value: "hasAbstract",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: evaluateBoolean(item => item.abstract),
		},
		{
			label: "Citekey exists",
			value: "hasCitekey",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: evaluateBoolean(item => item.raw.has_citekey)
		},
		{
			label: "DOI exists",
			value: "hasDOI",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: evaluateBoolean(item => item.raw.data.DOI)
		},
		{
			label: "Item added before",
			value: "addedBefore",
			presets: [
				{ label: "Today", value: "today" },
				{ label: "This week", value: "\"this week\"" },
				{ label: "This year", value: "\"this year\"" }
			],
			filter: filterWithPastDate(
				item => new Date(item.raw.data.dateAdded),
				{ compare: "before" },
			)
		},

		{
			label: "Item added between",
			value: "addedBetween",
			presets: [],
			filter: filterWithPastDate(
				item => new Date(item.raw.data.dateAdded),
				{ compare: "between" }
			),
		},
		{
			label: "Item type matches",
			value: "type",
			presets: Object.entries(typemap).map(([itemType, label]) => ({ label, value: itemType })),
			filter: filterWithQuery((term, item) => item.itemType === term),
		},
		{
			label: "Item has linked notes",
			value: "hasNotes",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: evaluateBoolean(item => item.children.notes.length > 0)
		},
		{
			label: "Item has linked PDFs",
			value: "hasPDFs",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: evaluateBoolean(item => item.children.pdfs.length > 0)
		},
		{
			label: "Roam page exists",
			value: "inRoam",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: evaluateBoolean(item => item.inGraph)
		},
		{
			label: "Tags include",
			value: "tags",
			presets: [],
			filter: filterWithQuery((term, item) => item.tags.includes(term))
		}
	], [typemap]);
	return { filters };
};

export { useItemFilters };