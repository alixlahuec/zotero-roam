import { ZoteroAPI } from "Types/externals";


export interface ZSimplifiedNote {
	date_added: string,
	date_modified: string,
	key: string,
	location: string,
	link_note: string,
	note: string,
	parent_item: string,
	raw: ZoteroAPI.ItemNote,
	tags: string[]
}
/** Simplifies data structure for Zotero notes
 * @returns The simplified array of notes
 */
function simplifyZoteroNotes(notes: ZoteroAPI.ItemNote[]): ZSimplifiedNote[] {
	return notes.map(nt => {
		const {
			dateAdded: date_added,
			dateModified: date_modified,
			parentItem: parent_item,
			note,
			tags
		} = nt.data;

		const location = nt.library.type + "s/" + nt.library.id;
		const libLoc = location.startsWith("groups/") ? location : "library";
		const link_note = `zotero://select/${libLoc}/items/${nt.key}`;

		return {
			date_added,
			date_modified,
			key: nt.key,
			location,
			link_note,
			note,
			parent_item,
			raw: nt,
			tags: tags.map(t => t.tag)
		};
	});
}

export {
	simplifyZoteroNotes
};