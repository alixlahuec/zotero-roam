import { makeCollection, zotero } from "./common";
import { libraries } from "./libraries";
import { rest } from "msw";

const { userLibrary, groupLibrary } = libraries;

const data = [
	makeCollection({
		key: "ABCDEF",
		library: userLibrary,
		name: "Important items",
		version: 31
	}),
	makeCollection({
		key: "PQRST",
		library: groupLibrary,
		name: "Reading List",
		version: 14
	})
];

export const findCollections = (type, id, since) => {
	return data.filter(cl => cl.library.type == type && cl.library.id == id && cl.version > Number(since));
};

export const handleCollections = rest.get(
	zotero(":libraryType/:libraryID/collections"),
	(req, res, ctx) => {
		const { libraryType, libraryID } = req.params;
		const since = req.url.searchParams.get("since") || 0;

		const { id, type, version } = Object.values(libraries).find(lib => lib.path == `${libraryType}/${libraryID}`);
		const collections = findCollections(type, id, since);

		return res(
			ctx.set("last-modified-version", `${version}`),
			ctx.set("total-results", Math.min(collections.length, 100)), // We're not mocking with additional requests
			ctx.json(collections)
		);
	}
);

export {
	data as collections
};