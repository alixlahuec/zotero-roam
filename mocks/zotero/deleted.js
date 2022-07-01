import { zotero, makeCollection } from "./common";
import { rest } from "msw";
import { libraries } from "./libraries";

const { userLibrary, groupLibrary } = libraries;

const data = {
	[userLibrary.path]: {
		collections: [
			makeCollection({
				key: "CRTG512",
				library: userLibrary,
				name: "A deleted collection",
				version: 144
			})
		],
		items: []
	},
	[groupLibrary.path]: {
		collections: [],
		items: []
	}
};

export const findDeleted = ({ path, since }) => {
	const entities = {};

	entities.collections = data[path]
		.collections
		.filter(cl => cl.version > since);
    
	entities.items = data[path]
		.items
		.filter(it => it.version > since);
   
	return entities;
};

export const handleDeleted = rest.get(
	zotero(":libraryType/:libraryID/deleted"),
	(req, res, ctx) => {
		const { libraryType, libraryID } = req.params;
		const since = req.url.searchParams.get("since");
		const path = `${libraryType}/${libraryID}`;

		const { collections, items } = findDeleted({ path, since });

		return res(
			ctx.json({
				collections,
				items,
				searches: [],
				settings: [],
				tags: []
			})
		);
	}
);

export {
	data as deletions
};