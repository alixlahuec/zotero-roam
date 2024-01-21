import { simplifyZoteroNotes } from "./helpers";
import { libraries, sampleNote } from "Mocks";


const { userLibrary } = libraries;

test("simplifyZoteroNotes", () => {
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