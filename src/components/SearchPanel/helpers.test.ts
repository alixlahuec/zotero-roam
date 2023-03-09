import { cleanLibrary } from "./helpers";

import { items } from "Mocks/zotero/items";
import { libraries } from "Mocks/zotero/libraries";


const { userLibrary } = libraries;

test("Simplifies Zotero item metadata", () => {
	expect(cleanLibrary([items[0]], new Map()))
		.toEqual([{
			abstract: items[0].data.abstractNote,
			authors: "Bloch and Rozmovits",
			authorsFull: ["Gary Bloch", "Linda Rozmovits"],
			authorsLastNames: ["Bloch", "Rozmovits"],
			authorsRoles: ["author", "author"],
			children: {
				pdfs: [],
				notes: []
			},
			createdByUser: null,
			inGraph: false,
			itemKey: items[0].data.key,
			itemType: items[0].data.itemType,
			key: "blochImplementingSocialInterventions2021",
			location: userLibrary.path,
			meta: "Bloch and Rozmovits (2021)",
			publication: "CMAJ",
			tags: [],
			title: "Implementing social interventions in primary care",
			weblink: {
				href: "https://www.cmaj.ca/content/193/44/E1696",
				title: "https://www.cmaj.ca/content/193/44/E1696"
			},
			year: "2021",
			zotero: {
				local: "zotero://select/library/items/" + items[0].data.key,
				web: "https://www.zotero.org/" + userLibrary.path + "/items/" + items[0].data.key
			},
			raw: items[0],
			_multiField: items[0].data.abstractNote + " Gary Bloch Linda Rozmovits 2021 Implementing social interventions in primary care blochImplementingSocialInterventions2021"
		}]);
});