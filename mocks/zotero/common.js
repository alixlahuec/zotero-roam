/**
 * @param {string} URI 
 * @returns 
 */
export const zotero = (URI) => "https://api.zotero.org/" + URI;

export const makeCollection = ({ key, library, name, version, hasParent = false, hasChildren = 0 }) => ({
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

/**
 * @param {{key: string, library: ZMockLibrary, parentItem?: string | null}} param0 
 * @returns 
 */
export const makeEntityLinks = ({ key, library, parentItem = null }) => {
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

/**
 * 
 * @param {{
 * citekey?: string | false,
 * itemType?: ZoteroAPI.ItemTopType,
 * key?: string,
 * library: ZLibraryMock,
 * title?: string,
 * version?: number,
 * data?: Partial<ZoteroAPI.ItemTop["data"]>
 * }} config
 */
export const makeItemMetadata = ({ citekey = false, itemType = null, key = "__NO_UNIQUE_KEY__", library, title ="", version = 1, data = {} }) => ({
	data: {
		creators: [],
		collections: [],
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

/**
 * @param {ZLibraryMock} library 
 * @returns 
 */
export const makeLibraryMetadata = (library) => {
	const { type, id, name, path } = library;
	return {
		type: type.slice(0, -1),
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