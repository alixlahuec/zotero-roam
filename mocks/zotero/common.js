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

export const makeEntityLinks = ({ key, library }) => {
	const { type, name, path } = library;
	return {
		self: {
			href: `https://api.zotero.org/${path}/items/${key}`,
			type: "application/json"
		},
		alternate: {
			href: `https://www.zotero.org/${type == "user" ? name : path}/items/${key}`,
			type: "text/html"
		}
	};
};

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

export const makeLibraryMetadata = (library) => {
	const { type, id, name, path } = library;
	return {
		type,
		id,
		name,
		links: {
			alternate: {
				href: "https://www.zotero.org/" + (type == "user" ? name : path),
				type: "text/html"
			}
		}
	};
};