import { http, HttpResponse } from "msw";
import { zotero } from "./common";
import { libraries } from "./libraries";
import { searchEngine } from "../../src/utils";
import { Mocks } from "Mocks";


const { userLibrary, groupLibrary } = libraries;

type MakeTagArgs = {
	tag: string,
	library: Mocks.Library,
} & Partial<Mocks.Tag["meta"]>;
const makeTag = ({ tag, library, type = 1, numItems = 1 }: MakeTagArgs): Mocks.Tag => {
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

export const findTags = (path: string, token: string) => {
	const tagList = data[path];
	return tagList.filter(t => searchEngine(t.tag, token, { any_case: true, match: "exact", search_compounds: true }));
};

const data: Record<string, Mocks.Tag[]> = {
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
	http.get<Mocks.RequestParams.Tags, never, Mocks.Responses.TagsGet>(
		zotero(":libraryType/:libraryID/tags"),
		({ params }) => {
			const { libraryType, libraryID } = params;
            
			const { path, version } = Object.values(libraries).find(val => val.path == `${libraryType}/${libraryID}`)!;
			const tags = data[path];

			return HttpResponse.json(
				tags,
				{
					headers: {
						"last-modified-version": `${version}`,
						// We're not mocking with additional requests
						"total-results": `${Math.min(tags.length, 100)}`
					}
				}
			);
		}
	),
	http.delete<Mocks.RequestParams.Tags, never, Mocks.Responses.TagsDelete>(
		zotero(":libraryType/:libraryID/tags"),
		({ request, params }) => {
			const { libraryType, libraryID } = params;
			// const tag = req.url.searchParams("tag");
			const ifUnmodifiedSince = request.headers.get("If-Unmodified-Since-Version");

			const { version } = Object.values(libraries).find(val => val.path == `${libraryType}/${libraryID}`)!;

			if(Number(ifUnmodifiedSince) < version){
				return new HttpResponse(null, { status: 412, statusText: "Precondition failed" });
			} else {
				return new HttpResponse(null, { status: 204, statusText: "No content" });
			}
		}
	)
];

export {
	data as tags
};