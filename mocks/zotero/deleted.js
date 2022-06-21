import { zotero } from "./common";
import { rest } from "msw";
import { data as collections } from "./collections";
import { data as libraries } from "./libraries";

const { userLibrary, groupLibrary } = libraries;

export const data = {
	[userLibrary.path]: {
		collections: [{...collections[0], key: "CRTG512"}],
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

		const { collections = [], items = [] } = findDeleted({ path, since });

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