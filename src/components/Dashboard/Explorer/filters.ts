import { useMemo } from "react";
import { QueryFilter } from "@hooks";

import { useTypemapSettings } from "Components/UserSettings";

import { searchEngine } from "../../../utils";
import { isZAnnotation, ZCleanItemPDF, ZCleanItemTop, ZItemAnnotation, ZItemNote } from "Types/transforms";


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
				{ label: "This week", value: "0w" },
				{ label: "This year", value: "0y" }
			],
			evaluate: (query, item) => {
				let dateCheck = new Date();
				dateCheck.setHours(0, 0, 0);
				
				// TODO: add NLP and processing logic here
				if (query == "today") {
					// Date is already set to today
				} else if (query == "0w") {
					// Sunday is 0, Monday is 6
					const weekDay = dateCheck.getDay();
					const weekStartDiff = 6 - weekDay;
		
					// Set the date to the first day of the current week
					dateCheck.setDate(dateCheck.getDate() - weekStartDiff);
				} else if (query == "0y") {
					// Set the date to Jan 1st of the current year
					dateCheck.setMonth(0);
					dateCheck.setDate(0);
				}
		
				return new Date(item.raw.data.dateAdded) < dateCheck;
			}
		},
		// TODO: extract the date handling into a method, then add the other operators for "date added"
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