import { rest } from "msw";
import { makeCollection, zotero } from "./common";
import { libraries } from "./libraries";
import { Mocks } from "Mocks/types";


const { userLibrary, groupLibrary } = libraries;

const data: Mocks.Collection[] = [
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

export const findCollections = (type: Mocks.Library["type"], id: number, since: number) => {
	return data.filter(cl => cl.library.type + "s" == type && cl.library.id == id && cl.version > since);
};

export const handleCollections = rest.get<never, Mocks.RequestParams.Collections, Mocks.Responses.Collections>(
	zotero(":libraryType/:libraryID/collections"),
	(req, res, ctx) => {
		const { libraryType, libraryID } = req.params;
		const since = req.url.searchParams.get("since") || "0";

		const { id, type, version } = Object.values(libraries).find(lib => lib.path == `${libraryType}/${libraryID}`)!;
		const collections = findCollections(type, id, Number(since));

		return res(
			ctx.set("last-modified-version", `${version}`),
			ctx.set("total-results", `${Math.min(collections.length, 100)}`), // We're not mocking with additional requests
			ctx.json(collections)
		);
	}
);

export {
	data as collections
};