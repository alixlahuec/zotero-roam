import { 
	categorizeLibraryItems,
	identifyChildren } from "../../src/utils";


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
