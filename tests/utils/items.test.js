import { 
	categorizeLibraryItems,
	cleanLibrary,
	identifyChildren } from "../../src/utils";
import { items } from "Mocks/zotero/items";
import { libraries } from "Mocks/zotero/libraries";


const { userLibrary } = libraries;

test("Categorizes Zotero items", () => {
	const testItems = [
		{ data: { itemType: "journalArticle" } },
		{ data: { itemType: "podcast" } },
		{ data: { itemType: "note" } },
		{ data: { itemType: "annotation" } },
		{ data: { itemType: "attachment", contentType: "application/pdf" } },
		{ data: { itemType: "attachment", contentType: "text/html" } },
		{ data: { itemType: "attachment", contentType: "video/mp4" } }
	];
	expect(categorizeLibraryItems(testItems))
		.toEqual({
			items: [
				{ data: { itemType: "journalArticle" } },
				{ data: { itemType: "podcast" } }
			],
			notes: [
				{ data: { itemType: "note" } },
				{ data: { itemType: "annotation" } }
			],
			pdfs: [
				{ data: { itemType: "attachment", contentType: "application/pdf" } }
			]
		});
});

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

test("Identifies the children of a Zotero item", () => {
	const pdfs = [
		{ data: { parentItem: "A12BCDEF" }, key: "P34QRSTU", library: { type: "user", id: 98765 } },
		{ data: { parentItem: "A12BCDEF" }, key: "XY456ABC", library: { type: "user", id: 98765 } },
		{ data: { parentItem: "E23AVTF" }, key: "PCL41TRX", library: { type: "user", id: 98765 } }
	];
	const notes = [
		{ data: { itemType: "note", parentItem: "A12BCDEF" }, key: "child_note", library: { type: "user", id: 98765 } },
		{ data: { itemType: "note", parentItem: "JLP19FRG" }, key: "other_note", library: { type: "user", id: 98765 } },
		{ data: { itemType: "annotation", parentItem: "P34QRSTU" }, key: "child_annotation", library: { type: "user", id: 98765 } },
		{ data: { itemType: "annotation", parentItem: "YTL3I9BN" }, key: "other_annotation", library: { type: "user", id: 98765 } }
	];

	expect(identifyChildren("A12BCDEF", "users/98765", { pdfs, notes }))
		.toMatchObject({
			pdfs: [
				{ key: "P34QRSTU" },
				{ key: "XY456ABC" }
			],
			notes: [
				{ key: "child_note" },
				{ key: "child_annotation" }
			]
		});
});
