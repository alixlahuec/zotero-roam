import { http, HttpResponse } from "msw";
import { makeCollection, makeItemMetadata, zotero } from "./common";
import { libraries } from "./libraries";
import { Mocks } from "Mocks";


const { userLibrary, groupLibrary } = libraries;

const data: Record<string, { collections: Mocks.Collection[], items: Mocks.ItemTop[] }> = {
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

export const findDeleted = ({ path, since }: { path: string, since: number }) => {
	const entities: Partial<Mocks.Responses.Deleted> = {};

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

export const handleDeleted = http.get<Mocks.RequestParams.Deleted, never, Mocks.Responses.Deleted>(
	zotero(":libraryType/:libraryID/deleted"),
	({ request, params }) => {
		const { libraryType, libraryID } = params;
		const url = new URL(request.url);
		const since = Number(url.searchParams.get("since"));
		const path = `${libraryType}/${libraryID}`;

		const { collections = [], items = [] } = findDeleted({ path, since });

		return HttpResponse.json({
			collections,
			items,
			searches: [],
			tags: []
		});
	}
);

export {
	data as deletions
};