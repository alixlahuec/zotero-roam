
/**
 * @see https://github.com/zotero/translators/blob/master/index.d.ts
 */
export namespace ZoteroAPI {
	/** A creator's role (author, editor, translator...) */
	export type CreatorType = _CreatorType;

	/** A creator of a Zotero item */
	export type Creator = ({ name: string } | { firstName: string, lastName: string }) & {
		creatorType: CreatorType
	};

	/** An entity's related links */
	type EntityLinks = Record<string, { href: string, type: string }>;

	/** An entity's library */
	export type EntityLibrary = {
		/** The library's Zotero ID */
		id: number,
		/** Links related to the library */
		links: EntityLinks,
		/** The library's display name */
		name: string,
		/** The library's type */
		type: LibraryType
	};

	type ExportFormat = _ExportFormat;

	export type LibraryType = "user" | "group";
	export type LibraryTypeURI = `${LibraryType}s`;

	/** Basic metadata for Zotero items and collections */
	interface Base {
		/** The entity's Zotero key */
		key: string,
		/** The entity's Zotero library */
		library: EntityLibrary,
		/** Links related to the Zotero entity */
		links: EntityLinks,
		/** Metadata about the entity */
		meta: Record<string, any>,
		/** The entity's current version */
		version: number
	}

	export interface Collection extends Base {
		data: {
			/** The collection's Zotero key */
			key: Base["key"],
			/** The collection's display name */
			name: string,
			/** The key of the collection's parent, if any */
			parentCollection: string | false,
			relations: Record<string, string | string[]>,
			version: Base["version"]
		} & Record<string, any>,
		meta: {
			numCollections: number,
			numItems: number
		}
	}

	export interface Tag {
		links: Base["links"],
		meta: {
			numItems: number,
			type: 0 | 1 | number
		},
		tag: string,
	}

	type ItemTag = {
		tag: Tag["tag"],
		type?: Tag["meta"]["type"]
	};

	type ItemTopType = _ItemTopType;

	type ItemType = ItemTopType | "attachment" | "annotation" | "note";

	/** Basic metadata for Zotero items */
	interface ItemDataBase<T extends ItemType> {
		/** The datetime when the item was created */
		dateAdded: string,
		/** The datetime when the item was last modified */
		dateModified: string,
		/** The item's type */
		itemType: T,
		/** The item's Zotero key */
		key: Base["key"],
		/** Zotero entities linked that are linked to the item */
		relations: Record<string, string | string[]>,
		/** The item's tags */
		tags: ItemTag[]
		/** The item's current version */
		version: Base["version"]
	}

	export interface ItemAnnotation extends Base {
		data: ItemDataBase<"annotation"> & {
			/** The highlight color of the annotation */
			annotationColor: string,
			/** The text of the comment, if any */
			annotationComment: string,
			/** The label for the page where the annotation is located */
			annotationPageLabel: string,
			/** The position of the annotation in the PDF. This is a stringified JSON object, containing the page index and the rect coordinates of the annotation.
			 * @example "{\"pageIndex\":24,\"rects\":[[203.6,431.053,546.865,441.6],[203.6,419.056,536.829,429.603],[203.6,407.059,566.448,417.606],[203.6,395.062,564.521,405.609],[203.6,383.065,265.699,393.612]]}"
			 */
			annotationPosition: string,
			/** The position of the annotation in the page.
			 * @example "00024|001317|00350"
			 */
			annotationSortIndex: string,
			/** The text of the highlight */
			annotationText: string,
			/** The type of annotation */
			annotationType: "highlight" | "image",
			/** The Zotero key of the item's parent */
			parentItem: string
		}
	}

	export interface ItemAttachment extends Base {
		data: ItemDataBase<"attachment"> & {
			/** The type of attachment
			 * @example "application/pdf"
			 */
			contentType: string,
			parentItem: string,
			[x: string]: any
		}
	}

	export interface ItemNote extends Base {
		data: ItemDataBase<"note"> & {
			note: string,
			parentItem: string
		} & Record<string, any>
	}

	export interface ItemTop extends Base {
		data: ItemDataBase<ItemTopType> & {
			collections: string[],
			creators: Creator[],
			extra: string,
			title: string
		} & { [P in _ItemTopDataFields]?: any },
		meta: {
			creatorSummary: string,
			numChildren: number,
			parsedDate: string,
			[x: string]: any
		} & Record<string, any>
	}

	/** A Zotero item (top-level, annotation, note, attachment...) */
	export type Item = ItemAnnotation | ItemAttachment | ItemNote | ItemTop;

	export namespace Requests {
		/** Parameters to control bibliography output from Zotero */
		export interface BibliographyArgs {
			/** The output format(s) to use (API default: `data`). Multiple formats can be requested, by passing them as a comma-separated list.
			 * @example "data,bib"
			 */
			include: string,
			/** Determines if URLs and DOIs should be formatted as links (API default: `0`). */
			linkwrap: 0 | 1,
			/** The locale to use for generating citations (API default: `en-US`). */
			locale: string,
			/** The citation style to use (API default: `chicago-note-bibliography`).
			 * @example "apa"
			 */
			style: string
		}
	}

	export namespace Responses {
		/** API KEYS */
		/** @see https://www.zotero.org/support/dev/web_api/v3/syncing#verify_key_access */
		export interface Permissions {
			access: {
				user?: {
					files: boolean,
					library: boolean,
					notes: boolean,
					write: boolean
				},
				groups?: {
					[P in "all" | string]?: {
						library: boolean,
						write: boolean
					}
				}
			},
			key: string,
			userID: number,
			username?: string
		}

		/** COLLECTIONS */

		export type Collections = Collection[];

		/** DELETIONS */

		export interface Deleted {
			collections: string[],
			items: string[],
			searches: string[],
			tags: string[]
		}

		/** ITEMS */
		type ExportFormatData = {
			[Format in ExportFormat]: string
		}

		type IncludeJSON = ExportFormatData & {
			bib: string,
			citation: string,
			data: Item["data"]
		}
		type IncludeFormat = keyof IncludeJSON;

		type Include<K extends IncludeFormat = "data"> = K extends "data"
			? Item
			: Base & Pick<IncludeJSON, K> & { meta?: Record<string, unknown> };

		export type ItemGet<T extends IncludeFormat = "data"> = Include<T>;
		export type ItemsGet<T extends IncludeFormat = "data"> = Include<T>[];

		export interface ItemsWrite {
			failed: Record<number, string>,
			unchanged: Record<number, string>,
			success: Record<number, string>,
			successful: Record<number, Item>
		}

		/** TAGS */
		export type Tags = Tag[];
		// TODO: Verify return type
		export type TagsDelete = null;

	}
}

type _CreatorType =
	| "artist"
	| "contributor"
	| "performer"
	| "composer"
	| "wordsBy"
	| "sponsor"
	| "cosponsor"
	| "author"
	| "commenter"
	| "editor"
	| "translator"
	| "seriesEditor"
	| "bookAuthor"
	| "counsel"
	| "programmer"
	| "reviewedAuthor"
	| "recipient"
	| "director"
	| "scriptwriter"
	| "producer"
	| "interviewee"
	| "interviewer"
	| "cartographer"
	| "inventor"
	| "attorneyAgent"
	| "podcaster"
	| "guest"
	| "presenter"
	| "castMember";

type _ExportFormat =
	| "bibtex"
	| "biblatex"
	| "bookmarks"
	| "coins"
	| "csljson"
	| "csv"
	| "mods"
	| "refer"
	| "rdf_bibliontology"
	| "rdf_dc"
	| "rdf_zotero"
	| "ris"
	| "tei"
	| "wikipedia";

type _ItemTopType =
	| "artwork"
	| "audioRecording"
	| "bill"
	| "blogPost"
	| "book"
	| "bookSection"
	| "case"
	| "computerProgram"
	| "conferencePaper"
	| "dictionaryEntry"
	| "document"
	| "email"
	| "encyclopediaArticle"
	| "film"
	| "forumPost"
	| "hearing"
	| "instantMessage"
	| "interview"
	| "journalArticle"
	| "letter"
	| "magazineArticle"
	| "manuscript"
	| "map"
	| "newspaperArticle"
	| "patent"
	| "podcast"
	| "preprint"
	| "presentation"
	| "radioBroadcast"
	| "report"
	| "statute"
	| "thesis"
	| "tvBroadcast"
	| "videoRecording"
	| "webpage";

type _ItemTopDataFields =
	| "numPages"
	| "numberOfVolumes"
	| "abstractNote"
	| "accessDate"
	| "applicationNumber"
	| "archive"
	| "archiveID"
	| "artworkSize"
	| "assignee"
	| "billNumber"
	| "blogTitle"
	| "bookTitle"
	| "callNumber"
	| "caseName"
	| "citationKey"
	| "code"
	| "codeNumber"
	| "codePages"
	| "codeVolume"
	| "committee"
	| "company"
	| "conferenceName"
	| "country"
	| "court"
	| "DOI"
	| "date"
	| "dateDecided"
	| "dateEnacted"
	| "dictionaryTitle"
	| "distributor"
	| "docketNumber"
	| "documentNumber"
	| "edition"
	| "encyclopediaTitle"
	| "episodeNumber"
	| "extra"
	| "audioFileType"
	| "filingDate"
	| "firstPage"
	| "videoRecordingFormat"
	| "audioRecordingFormat"
	| "format"
	| "forumTitle"
	| "genre"
	| "history"
	| "ISBN"
	| "ISSN"
	| "identifier"
	| "institution"
	| "issue"
	| "issueDate"
	| "issuingAuthority"
	| "journalAbbreviation"
	| "label"
	| "language"
	| "legalStatus"
	| "legislativeBody"
	| "libraryCatalog"
	| "archiveLocation"
	| "artworkMedium"
	| "interviewMedium"
	| "meetingName"
	| "nameOfAct"
	| "network"
	| "number"
	| "organization"
	| "pages"
	| "patentNumber"
	| "place"
	| "postType"
	| "priorityNumbers"
	| "proceedingsTitle"
	| "programmingLanguage"
	| "programTitle"
	| "publicLawNumber"
	| "publicationTitle"
	| "publisher"
	| "references"
	| "repositoryLocation"
	| "reportNumber"
	| "reportType"
	| "reporter"
	| "reporterVolume"
	| "repository"
	| "rights"
	| "runningTime"
	| "scale"
	| "section"
	| "series"
	| "seriesNumber"
	| "seriesText"
	| "seriesTitle"
	| "session"
	| "shortTitle"
	| "status"
	| "studio"
	| "subject"
	| "system"
	| "letterType"
	| "manuscriptType"
	| "mapType"
	| "thesisType"
	| "presentationType"
	| "type"
	| "url"
	| "university"
	| "versionNumber"
	| "volume"
	| "websiteTitle"
	| "websiteType";
