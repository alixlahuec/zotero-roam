import { CitoidAPI } from "@clients/citoid";
import { ZoteroAPI } from "@clients/zotero";

import { ArgsMetadataBlocks, ArgsMetadataSmartblock, OutcomeMetadataStatus, OutcomePage } from "Types/extension";
import { ZItemAnnotation, ZItemNote, ZItemTop } from "Types/transforms";


export namespace Events {
	/** Signals a metadata import has terminated
	 * @event zotero-roam:metadata-added
	 * @see importItemMetadata
	 */
	export type MetadataAdded = {
		_type: "metadata-added",
		/** The configuration used for the import */
		args: ArgsMetadataBlocks | ArgsMetadataSmartblock,
		/** The details about the Roam page for the item */
		page: OutcomePage,
		/** The raw data provided as input */
		raw: Record<string, any>
	} & OutcomeMetadataStatus;


	/** Signals a notes import has terminated
	 * @event zotero-roam:notes-added
	 * @see importItemNotes
	 */
	export type NotesAdded = {
		_type: "notes-added",
		/** The configuration used for the import */
		args: ArgsMetadataBlocks,
		/** The details about the Roam page for the item */
		page: OutcomePage,
		/** The raw data provided as input */
		raw: { item: ZItemTop, notes: (ZItemNote | ZItemAnnotation)[] }
	} & OutcomeMetadataStatus;


	/** Signals a tag deletion has terminated
	 * @event zotero-roam:tags-deleted
	 * @see useDeleteTags
	 */
	export type TagsDeleted = {
		_type: "tags-deleted",
		/** The input provided to the deleting function */
		args: { tags: string[] },
		error: any,
		/** The path of the targeted library */
		library: string
	};


	/** Signals a tag modification has terminated
	 * @event zotero-roam:tags-modified
	 * @see useModifyTags
	 */
	export type TagsModified = {
		_type: "tags-modified",
		/** The input provided to the modifying function */
		args: { into: string, tags: string[] },
		data: {
			successful: ZoteroAPI.Responses.ItemsWrite[],
			failed: string[]
		},
		error: any,
		/** The path of the targeted library */
		library: string
	};


	/** Signals a data update has terminated
	* @event zotero-roam:update
	*/
	export type Update = {
		_type: "update",
		/** The path of the library that yielded the update */
		library: string,
		/** The library version since which elements were retrieved */
		since: number,
		/** Indicates if the update was successful */
		success: boolean
	} & (
			| { type: "items", data: ZoteroAPI.Item[], error: null }
			| { type: "items", data: null, error: Error }
			| { type: "collections", data: ZoteroAPI.Collection[], error: null }
			| { type: "collections", data: null, error: Error }
		);


	/** Signals a write call has terminated
	* @event zotero-roam:write
	*/
	export type Write = {
		_type: "write",
		/** The input provided to the writing function */
		args: { collections: string[], items: CitoidAPI.AsZotero[], tags: string[] },
		data: {
			successful: ZoteroAPI.Responses.ItemsWrite[],
			failed: string[]
		},
		error: any,
		/** The path of the targeted library */
		library: string
	};

	export type Details =
		| MetadataAdded
		| NotesAdded
		| TagsDeleted
		| TagsModified
		| Update
		| Write
		;
}