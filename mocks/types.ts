import { ZoteroAPI } from "Types/externals";
import { ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "Types/transforms";


export namespace Mocks {
	export type Annotation = ZItemAnnotation;

	export type Bib = ZoteroAPI.Responses.ItemGet<"biblatex">;

	export type Collection = ZoteroAPI.Collection;

	export type EntityLibrary = ZoteroAPI.EntityLibrary;

	export type ItemAttachment = ZItemAttachment;

	export type ItemBibliography = ZoteroAPI.Responses.ItemGet<"bib">;

	export type ItemNote = ZItemNote;

	export type ItemTop = ZItemTop;

	export type Tag = ZoteroAPI.Tag;

	export type Library = {
		id: number,
		links: {
			alternate: { href: string, type: string }
		},
		name: string,
		path: string,
		type: ZoteroAPI.LibraryTypeURI,
		username?: string,
		version: number
	}

	export namespace RequestBody {
		export type ItemsPost = Partial<ZoteroAPI.ItemTop["data"]>[];
	}

	export namespace RequestParams {
		export type Bibliography = Pick<_RequestParams, "libraryType" | "libraryID" | "itemKey">;
		export type Collections = Pick<_RequestParams, "libraryType" | "libraryID">;
		export type Deleted = Pick<_RequestParams, "libraryType" | "libraryID">;
		export type Items = Pick<_RequestParams, "libraryType" | "libraryID">;
		export type Permissions = Pick<_RequestParams, "apikey">;
		export type Tags = Pick<_RequestParams, "libraryType" | "libraryID">;
	}

	export namespace Responses {
		export type Bibliography = ZoteroAPI.Responses.ItemGet<"bib">;
		export type Collections = ZoteroAPI.Responses.Collections;
		export type Deleted = ZoteroAPI.Responses.Deleted;
		export type ItemsGet = ZoteroAPI.Responses.ItemsGet<"biblatex"> | ZoteroAPI.Responses.ItemsGet<"data">;
		// TODO: fix mock for writing items
		export type ItemsPost = { failed: Record<number, string>, unchanged: Record<number, string>, success: Record<number, string>, successful: Record<number, ItemTop> };
		export type Permissions = ZoteroAPI.Responses.Permissions;
		export type TagsGet = ZoteroAPI.Responses.Tags;
		export type TagsDelete = Record<string, never>;
	}
}

type _RequestParams = {
	apikey: string,
	itemKey: string,
	libraryType: ZoteroAPI.LibraryTypeURI,
	libraryID: string
};
