export const zotero = (URI) => "https://api.zotero.org/" + URI;

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