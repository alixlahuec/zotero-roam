import { ZLibraryMock } from "Mocks/types";
import { ZoteroAPI } from "Types/externals";


export const zotero = (URI: string) => "https://api.zotero.org/" + URI;


type MakeCollectionArgs = Omit<ZoteroAPI.Collection["data"], "parentCollection"> & {
	library: ZLibraryMock,
	hasParent?: ZoteroAPI.Collection["data"]["parentCollection"],
	hasChildren?: number
};
export const makeCollection = (
	{ key, library, name, version, hasParent = false, hasChildren = 0 }: MakeCollectionArgs
): ZoteroAPI.Collection => ({
	data: {
		key,
		name,
		parentCollection: hasParent,
		relations: {},
		version
	},
	key,
	library: makeLibraryMetadata(library),
	links: makeEntityLinks({ key, library }),
	meta: {
		numCollections: hasChildren,
		numItems: 1
	},
	version
});


type MakeEntityLinksArgs = {
	key: string,
	library: ZLibraryMock,
	parentItem?: string | false
};
export const makeEntityLinks = ({ key, library, parentItem = false }: MakeEntityLinksArgs) => {
	const { type, name, path } = library;
	let upLink = {};

	if(parentItem){
		upLink = {
			up: {
				href: `https://api.zotero.org/${path}/items/${parentItem}`,
				type: "application/json"
			}
		};
	}
	
	return {
		self: {
			href: `https://api.zotero.org/${path}/items/${key}`,
			type: "application/json"
		},
		alternate: {
			href: `https://www.zotero.org/${type == "users" ? name : path}/items/${key}`,
			type: "text/html"
		},
		...upLink
	};
};


type MakeItemMetadataArgs = {
	citekey?: string | false,
	itemType?: ZoteroAPI.ItemTop["data"]["itemType"],
	key?: string,
	library: ZLibraryMock,
	title?: string,
	version?: number,
	data?: Partial<ZoteroAPI.ItemTop["data"]>
};
export const makeItemMetadata = ({ citekey = false, itemType = "journalArticle", key = "__NO_UNIQUE_KEY__", library, title ="", version = 1, data = {} }: MakeItemMetadataArgs) => ({
	data: {
		creators: [],
		collections: [],
		dateAdded: "",
		dateModified: "",
		itemType,
		key,
		extra: citekey ? `Citation Key: ${citekey}` : "",
		relations: {},
		tags: [],
		title,
		version,
		...data
	},
	has_citekey: citekey ? true : false,
	key: citekey || key,
	library: makeLibraryMetadata(library),
	links: makeEntityLinks({ key, library }),
	meta: {},
	version
});


export const makeLibraryMetadata = (library: ZLibraryMock): ZoteroAPI.EntityLibrary => {
	const { type, id, name, path } = library;
	return {
		type: type.slice(0, -1) as ZoteroAPI.LibraryType,
		id,
		name,
		links: {
			alternate: {
				href: "https://www.zotero.org/" + (type == "users" ? name : path),
				type: "text/html"
			}
		}
	};
};