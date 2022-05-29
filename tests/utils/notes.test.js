import { formatItemNotes, formatZoteroNotes, simplifyZoteroNotes } from "../../src/utils";

const note = {
	data: {
		dateAdded: "2021-06-16T21:36:12Z",
		dateModified: "2021-06-16T21:36:12Z",
		key: "A12BCDEF", 
		itemType: "note", 
		note: "<div style=\"background-color: Yellow\">Annotations</div><p>\"After all, argues Balthasar, \"in a world without beauty... the good also loses its attractiveness, self-evidence why it must be carried out.\" Why not prefer evil over good? \"Why not investigate Satan's depth?\"  Why desire the beatific vision? Accordingly, Balthasar seeks to rectify the given imbalance by embarking on an \"archeology of alienated beauty\"  in dialogue with thinkers such as Irenaeus, Augustine, Pseudo-Dionysius, Dante, Hopkins, Solovyev, and others.\" (<a href=\"zotero://open-pdf/library/items/A12BCDEF?page=1\">Smith 2003:1</a>)</p>",
		parentItem: "P34QRSTU",
		relations: {},
		tags: [{tag: "toRead"}],
		version: 1234
	},
	has_citekey: false,
	key: "A12BCDEF",
	library: {
		id: 98765,
		links: {alternate: {href: "https://www.zotero.org/some_user_name", type: "text/html"}},
		name: "some_user_name",
		type: "user"
	},
	links: {
		alternate: {href: "https://www.zotero.org/some_user_name/items/A12BCDEF", type: "text/html"},
		self: {href: "https://api.zotero.org/users/98765/items/A12BCDEF", type: "application/json"},
		up: {href: "https://api.zotero.org/users/98765/items/P34QRSTU", type: "application/json"}
	},
	meta: {numChildren: 0},
	version: 1234
};

const notes = [
	{data: {note: "<h1>Note Title</h1><div class=\"div-class\"><span>Lorem ipsum</span></div>"}},
	{data: {note: "Click <a href=\"https://example.com\">here</a> to open a link"}},
	{data: {note: "See <a class=\"link-class\" href=\"https://example.com\">there</a> for a link with attributes"}},
	{data: {note: "\n\nSome text\n"}}
];

test("Simplifies notes", () => {
	expect(simplifyZoteroNotes([note]))
		.toEqual([
			{
				dateAdded: note.data.dateAdded,
				dateModified: note.data.dateModified,
				key: "A12BCDEF",
				library: "users/98765",
				link_note: "zotero://select/library/items/A12BCDEF",
				note: note.data.note,
				parentItem: "P34QRSTU",
				raw: note,
				tags: ["toRead"]
			}
		]);
});

test("Clean rich tags", () => {
	expect(formatZoteroNotes([notes[0]]))
		.toEqual(["**Note Title**Lorem ipsum"]);
});

test("Clean links", () => {
	expect(formatItemNotes([notes[1], notes[2]], "</p>"))
		.toEqual([
			"Click [here](https://example.com) to open a link",
			"See [there](https://example.com) for a link with attributes"
		]);
});

test("Clean newlines", () => {
	expect(formatItemNotes([notes[3]], "</p>"))
		.toEqual([
			"Some text"
		]);
});