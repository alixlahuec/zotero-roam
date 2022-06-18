import { zotero } from "./common";
import { rest } from "msw";
import { data as libraries } from "./libraries";

const { userLibrary, groupLibrary } = libraries;

const addCollectionInfo = ({ key, library, name, version }) => {
	const { id, links, name: libName, type } = library;
	return {
		data: {
			key,
			name,
			version
		},
		key,
		library: {
			id,
			links,
			name: libName,
			type
		},
		links: {},
		meta: {},
		version
	};
};

export const data = [
	{
		...addCollectionInfo({
			key: "ABCDEF",
			library: userLibrary,
			name: "Important items",
			version: 31
		})
	},
	{
		...addCollectionInfo({
			key: "PQRST",
			library: groupLibrary,
			name: "Reading List",
			version: 14
		})
	}
];

export const findCollections = (type, id, since = 0) => {
	return data.filter(cl => cl.library.type + "s" == type && cl.library.id == id && cl.version > since);
};

export const handleCollections = [
	rest.get(
		zotero(":libraryType/:libraryID/collections"),
		(req, res, ctx) => {
			const { libraryType, libraryID } = req.params;
			const { since = 0 } = req.url.searchParams;

			const { id, type, version } = Object.values(libraries).find(lib => lib.path == `${libraryType}/${libraryID}`);
			const collections = findCollections(type, id, since);
            
			return res(
				ctx.set("last-modified-version", `${version}`),
				ctx.set("total-results", Math.min(collections.length, 100)), // We're not mocking with additional requests
				ctx.json({
					data: collections,
					lastUpdated: version
				})
			);
		}
	)
];