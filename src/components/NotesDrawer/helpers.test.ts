import { simplifyZoteroNotes } from "./helpers";

import { libraries } from "Mocks/zotero/libraries";
import { sampleNote } from "Mocks/zotero/notes";


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