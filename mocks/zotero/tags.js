import { libraries } from "./libraries";
import { rest } from "msw";
import { searchEngine } from "../../src/utils";
import { zotero } from "./common";

const { userLibrary, groupLibrary } = libraries;

const makeTag = ({ tag, library, type = 1, numItems = 1 }) => {
	const { path } = library;
	return {
		tag,
		links: {
			self: {
				href: `https://api.zotero.org/${path}/tags/${encodeURIComponent(tag)}`,
				type: "application/json"
			},
			alternate: {
				href: `https://zotero.org/${path}/tags/${encodeURIComponent(tag)}`,
				type: "text/html"
			}
		},
		meta: {
			type,
			numItems
		}
	};
};

export const findTags = (path, token) => {
	const tagList = data[path];
	return tagList.filter(t => searchEngine(t.tag, token, { any_case: true, match: "exact", search_compounds: true }));
};

const data = {
	[userLibrary.path]: [
		makeTag({ tag: "immigrant youth", library: userLibrary, numItems: 2 }),
		makeTag({ tag: "immigration", library: userLibrary, type: 1 }),
		makeTag({ tag: "immigration", library: userLibrary, type: 0 }),
		makeTag({ tag: "IMMIGRATION", library: userLibrary, type: 1 }),
		makeTag({ tag: "patient journeys", library: userLibrary })
	],
	[groupLibrary.path]: [
		makeTag({ tag: "Urban design", library: groupLibrary, numItems: 11 }),
		makeTag({ tag: "HOUSING", library: groupLibrary, type: 0, numItems: 7 }),
		makeTag({ tag: "housing", library: groupLibrary, type: 0 }),
		makeTag({ tag: "housing", library: groupLibrary, type: 1, numItems: 4 })
	]
};

export const handleTags = [
	rest.get(
		zotero(":libraryType/:libraryID/tags"),
		(req, res, ctx) => {
			const { libraryType, libraryID } = req.params;
            
			const { path, version } = Object.values(libraries).find(val => val.path == `${libraryType}/${libraryID}`);
			const tags = data[path];

			return res(
				ctx.set("last-modified-version", version),
				ctx.set("total-results", Math.min(tags.length, 100)), // We're not mocking with additional requests
				ctx.json(tags)
			);
		}
	),
	rest.delete(
		zotero(":libraryType/:libraryID/tags"),
		(req, res, ctx) => {
			const { libraryType, libraryID } = req.params;
			// const tag = req.url.searchParams("tag");
			const ifUnmodifiedSince = req.headers.get("If-Unmodified-Since-Version");

			const { version } = Object.values(libraries).find(val => val.path == `${libraryType}/${libraryID}`);

			if(ifUnmodifiedSince < version){
				// TODO: Simulate this to check response parameters
				return res(
					ctx.status(412, "Precondition failed")
				);
			} else {
				return res(
					ctx.status(204, "No content")
				);
			}
		}
	)
];

export {
	data as tags
};