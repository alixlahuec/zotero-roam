import { http, HttpResponse } from "msw";
import { makeCollection, zotero } from "./common";
import { libraries } from "./libraries";
import { Mocks } from "Mocks";


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

export const handleCollections = http.get<Mocks.RequestParams.Collections, never, Mocks.Responses.Collections>(
	zotero(":libraryType/:libraryID/collections"),
	({ request, params }) => {
		const { libraryType, libraryID } = params;
		const url = new URL(request.url);
		const since = url.searchParams.get("since") || "0";

		const { id, type, version } = Object.values(libraries).find(lib => lib.path == `${libraryType}/${libraryID}`)!;
		const collections = findCollections(type, id, Number(since));

		return HttpResponse.json(
			collections,
			{
				headers: {
					"last-modified-version": `${version}`,
					// We're not mocking with additional requests
					"total-results": `${Math.min(collections.length, 100)}`
				}
			}
		);
	}
);

export {
	data as collections
};