import { useMemo } from "react";
import { QueryFilter } from "@hooks";

import { useTypemapSettings } from "Components/UserSettings";

import { searchEngine } from "../../../utils";
import { isZAnnotation, ZCleanItemPDF, ZCleanItemTop, ZItemAnnotation, ZItemNote } from "Types/transforms";
import { parse as chronoParse } from "chrono-node";


export const parseDateInThePast = (query: string) => {
	const result = chronoParse(query, undefined, { forwardDate: false });

	if (!result.length) return null
	
	const refTime = result[0].refDate;
	const parsedDate = result[0].start;
	const date = parsedDate.date();

	if (!parsedDate.isCertain("year")) {
		date.setFullYear(refTime.getFullYear());
	}

	if (!parsedDate.isCertain("hour")) {
		date.setHours(0, 0, 0, 0);
	}

	return date;
};


export const parseDateRangeInThePast = (query: string) => {
	const result = chronoParse(query, undefined, { forwardDate: false });

	if (!result.length) return null
	
	const refTime = result[0].refDate;

	const parsedStart = result[0].start;
	const startDate = parsedStart.date();
	if (!parsedStart.isCertain("year")) {
		startDate.setFullYear(refTime.getFullYear());
	}
	if (!parsedStart.isCertain("hour")) {
		startDate.setHours(0, 0, 0, 0);
	}

	const parsedEnd = result[0].end;
	let endDate = refTime;
	if (parsedEnd) {
		endDate = parsedEnd.date();

		if (!parsedEnd.isCertain("year")) {
			endDate.setFullYear(refTime.getFullYear());
		}
		if (!parsedEnd.isCertain("month")) {
			endDate.setFullYear(endDate.getFullYear() + 1, 0, 0);
		} else if (!parsedEnd.isCertain("day")) {
			if (endDate.getMonth() === 11) {
				endDate.setFullYear(endDate.getFullYear() + 1, 0, 0);
			} else {
				endDate.setMonth(endDate.getMonth() + 1, 0);
			}
		}
		if (!parsedEnd.isCertain("hour")) {
			endDate.setDate(endDate.getDate() + 1);
			endDate.setHours(0, 0, 0, 0);
		}
	}

	console.log({ parsedStart, parsedEnd , startDate, endDate });

	return [startDate, endDate] as const;
}


export const useItemFilters = () => {
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