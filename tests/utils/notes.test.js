import { formatItemNotes, formatZoteroNotes, simplifyZoteroNotes } from "../../src/utils";
import { libraries } from "../../mocks/zotero/libraries";
import { sampleNote } from "../../mocks/zotero/notes";

const { userLibrary } = libraries;

test("Simplifies notes", () => {
	expect(simplifyZoteroNotes([sampleNote]))
		.toEqual([
			{
				date_added: sampleNote.data.dateAdded,
				date_modified: sampleNote.data.dateModified,
				key: sampleNote.key,
				location: userLibrary.path,
				link_note: "zotero://select/library/items/" + sampleNote.key,
				note: sampleNote.data.note,
				parent_item: sampleNote.data.parentItem,
				raw: sampleNote,
				tags: ["toRead"]
			}
		]);
});

describe("Parsing HTML notes", () => {
	const notes = [
		{data: {note: "<h1>Note Title</h1><div class=\"div-class\"><span>Lorem ipsum</span></div>"}},
		{data: {note: "Click <a href=\"https://example.com\">here</a> to open a link"}},
		{data: {note: "See <a class=\"link-class\" href=\"https://example.com\">there</a> for a link with attributes"}},
		{data: {note: "\n\nSome text\n"}}
	];	

	it("cleans markup from rich tags", () => {
		expect(formatZoteroNotes([notes[0]]))
			.toEqual(["**Note Title**Lorem ipsum"]);
	});
	
	it("formats links into Markdown", () => {
		expect(formatItemNotes([notes[1], notes[2]], "</p>"))
			.toEqual([
				"Click [here](https://example.com) to open a link",
				"See [there](https://example.com) for a link with attributes"
			]);
	});
	
	it("removes newlines", () => {
		expect(formatItemNotes([notes[3]], "</p>"))
			.toEqual([
				"Some text"
			]);
	});
});