import { useMemo } from "react";

import { useTypemapSettings } from "Components/UserSettings";

import { QueryFilter } from "@hooks";

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
			evaluate: (query, item) => {
				const boolCheck = query == "true" ? true : false;
				return Boolean(item.abstract) === boolCheck;
			}
		},
		{
			label: "Citekey exists",
			value: "hasCitekey",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: (query, item) => {
				const boolCheck = query == "true" ? true : false;
				return Boolean(item.raw.has_citekey) === boolCheck;
			}
		},
		{
			label: "DOI exists",
			value: "hasDOI",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: (query, item) => {
				const boolCheck = query == "true" ? true : false;
				return Boolean(item.raw.data.DOI) === boolCheck;
			}
		},
		{
			label: "Item added before",
			value: "addedBefore",
			presets: [
				{ label: "Today", value: "today" },
				{ label: "This week", value: "\"this week\"" },
				{ label: "This year", value: "\"this year\"" }
			],
			evaluate: (query, item) => {
				const queryDate = parseDateInThePast(query);
				if (queryDate === null) return false

				return new Date(item.raw.data.dateAdded) < queryDate;
			}
		},

		{
			label: "Item added between",
			value: "addedBetween",
			presets: [],
			evaluate: (query, item) => {
				const queryDateRange = parseDateRangeInThePast(query);
				if (queryDateRange === null) return false

				const itemDateAdded = new Date(item.raw.data.dateAdded);
				return queryDateRange[0] < itemDateAdded && itemDateAdded < queryDateRange[1];
			}
		},
		{
			label: "Item type matches",
			value: "type",
			presets: Object.entries(typemap).map(([itemType, label]) => ({ label, value: itemType })),
			// TODO: support OR query
			evaluate: (query, item) => {
				return item.itemType === query;
			}
		},
		{
			label: "Item has linked notes",
			value: "hasNotes",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: (query, item) => {
				const boolCheck = query == "true" ? true : false;
				return (item.children.notes.length > 0) === boolCheck;
			}
		},
		{
			label: "Item has linked PDFs",
			value: "hasPDFs",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: (query, item) => {
				const boolCheck = query == "true" ? true : false;
				return (item.children.pdfs.length > 0) === boolCheck;
			}
		},
		{
			label: "Roam page exists",
			value: "inRoam",
			presets: [
				{ label: "Yes", value: "true" },
				{ label: "No", value: "false" },
			],
			evaluate: (query, item) => {
				const boolCheck = query == "true" ? true : false;
				return Boolean(item.inGraph) === boolCheck;
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
	], [typemap]);
	return { filters };
};

export { useItemFilters };