import { makeEntityLinks, makeLibraryMetadata } from "./common";
import { libraries } from "./libraries";
import { Mocks } from "Mocks";


const { userLibrary } = libraries;

type MakeNoteArgs = {
	key: string,
	library: Mocks.Library,
	data: Partial<Mocks.ItemNote["data"]>,
	note: Mocks.ItemNote["data"]["note"],
	numChildren?: number,
	parentItem: string,
	version?: number
};
const makeNote = ({ key, library, data, note, numChildren = 0, parentItem, version = 1 }: MakeNoteArgs): Mocks.ItemNote => {
	return {
		key,
		data: {
			dateAdded: "2021-06-16T21:36:12Z",
			dateModified: "2021-06-16T21:36:12Z",
			itemType: "note",
			key,
			note,
			parentItem,
			relations: {},
			tags: [],
			version,
			...data
		},
		links: makeEntityLinks({ key, library, parentItem }),
		library: makeLibraryMetadata(library),
		meta: {
			numChildren
		},
		version,
		has_citekey: false
	};
};

export const sampleNote = makeNote({
	key: "A12BCDEF",
	library: userLibrary,
	note: "<div style=\"background-color: Yellow\">Annotations</div><p>\"After all, argues Balthasar, \"in a world without beauty... the good also loses its attractiveness, self-evidence why it must be carried out.\" Why not prefer evil over good? \"Why not investigate Satan's depth?\"  Why desire the beatific vision? Accordingly, Balthasar seeks to rectify the given imbalance by embarking on an \"archeology of alienated beauty\"  in dialogue with thinkers such as Irenaeus, Augustine, Pseudo-Dionysius, Dante, Hopkins, Solovyev, and others.\" (<a href=\"zotero://open-pdf/library/items/A12BCDEF?page=1\">Smith 2003:1</a>)</p>",
	parentItem: "P34QRSTU",
	data: {
		tags: [{ tag: "toRead" }]
	},
	version: 1234
});

export const sampleOlderNote = makeNote({
	key: "__OLDER_NOTE__",
	library: userLibrary,
	note: "<div>an older note</div>",
	parentItem: "P34QRSTU",
	data: {
		dateAdded: "1996-04-06T22:00:00Z"
	},
	version: 1234
});