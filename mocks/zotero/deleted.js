import { rest } from "msw";
import { makeCollection, makeItemMetadata, zotero } from "./common";
import { libraries } from "./libraries";


const { userLibrary, groupLibrary } = libraries;

/**
 * @constant {Record<string, {collections: ZoteroAPI.Collection[], items: ZoteroItem[]}>}
 */
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
		items: [
			{
				...makeItemMetadata({
					itemType: "journalArticle",
					key: "WSQ399YM",
					library: groupLibrary,
					title: "Lorem ipsum title",
					version: 128,
					data: {
						abstractNote: "",
						collections: [],
						creators: [
							{
								creatorType: "author", 
								firstName: "Some", 
								lastName: "Author"
							},
							{
								creatorType: "author", 
								firstName: "Another", 
								lastName: "Author"
							},
							{
								creatorType: "author",
								firstName: "Third",
								lastName: "Author"
							}
						],
						date: "2022-02-03",
						dateAdded: "2022-04-06T11:00:00Z",
						dateModified: "2022-04-06T11:00:00Z",
						DOI: "",
						publicationTitle: "",
						url: ""
					}
				}),
				meta: {
					creatorSummary: "Author et al.",
					numChildren: 0,
					parsedDate: "2022-02-03"
				}
			}
		]
	}
};

/**
 * @param {{path: string, since: number}} args 
 * @returns {{collections: string[], items: string[]}}
 */
export const findDeleted = ({ path, since }) => {
	const entities = {};

	entities.collections = data[path]
		.collections
		.filter(cl => cl.version > since)
		.map(cl => cl.key);
    
	entities.items = data[path]
		.items
		.filter(it => it.version > since)
		.map(it => it.key);
   
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
				tags: []
			})
		);
	}
);

export {
	data as deletions
};