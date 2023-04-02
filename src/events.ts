import zrToaster from "Components/ExtensionToaster";

import { cleanErrorIfAxios, pluralize } from "./utils";
import { ZItemAnnotation, ZItemAttachment, ZItemNote, ZItemTop } from "Types/transforms";
import { CitoidAPI, ZoteroAPI } from "Types/externals";
import { ArgsMetadataBlocks, ArgsMetadataSmartblock, OutcomeMetadataStatus, OutcomePage } from "Types/extension";


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
		raw: { item: ZItemTop, notes: (ZItemNote | ZItemAnnotation)[], pdfs: ZItemAttachment[] }
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
		/** The path of the targeted library */
		library: string
	} & ({ data: Record<string, any>, error: null } | { data?: Record<string, any>, error: Error });


	/** Signals a tag modification has terminated
	 * @event zotero-roam:tags-modified
	 * @see useModifyTags
	 */
	export type TagsModified = {
		_type: "tags-modified",
		/** The input provided to the modifying function */
		args: { into: string, tags: string[] },
		/** The path of the targeted library */
		library: string
	} & { data: { successful: Record<string, any>[], failed: Record<string, any>[] }, error: Error | null };


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
		error: unknown,
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


/**
 * Emits a custom event for the extension
 * @param event - The object containing the event's details
 * @param target - The DOM target on which the event should be emitted
 */
function emitCustomEvent(event: Events.Details, target: Element | Document = document) {
	const e = new CustomEvent<Events.Details>(`zotero-roam:${event._type}`, { bubbles: true, cancelable: true, detail: event });
	target.dispatchEvent(e);
}

/** Default hook for the zotero-roam:metadata-added event */
function metadataAdded(event: CustomEvent<Events.MetadataAdded>){
	const { error, page: { title }, success } = event.detail;
	if (error) {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: `Metadata import failed for ${title}`,
			context: {
				...event.detail,
				error: cleanErrorIfAxios(error)
			},
			showToaster: true
		});
	} else if (success) {
		zrToaster.show({
			intent: "success",
			message: "Metadata added to " + title
		});
	} else {
		window.zoteroRoam?.warn?.({
			origin: "API",
			message: "Metadata import had uncertain outcome",
			context: event.detail
		});
	}
}

/** Default hook for the zotero-roam:notes-added event */
function notesAdded(event: CustomEvent<Events.NotesAdded>){
	const { error, page: { title }, raw: { notes }, success } = event.detail;
	if (error) {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: `Notes import failed for ${title}`,
			context: {
				...event.detail,
				error: cleanErrorIfAxios(error)
			},
			showToaster: true
		});
	} else if (success) {
		zrToaster.show({
			intent: "success",
			message: "Notes added to " + title + ` (${notes.length})`
		});
	} else {
		window.zoteroRoam?.warn?.({
			origin: "API",
			message: "Notes import had uncertain outcome",
			context: event.detail
		});
	}
}

/** Default hook for the zotero-roam:tags-deleted event
 * @param {CustomEvent} event - The custom event emitted by the extension
 */
function tagsDeleted(event: CustomEvent<Events.TagsDeleted>){
	const { args: { tags }, error, library } = event.detail;
	if (error) {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Tag deletion failed",
			context: {
				...event.detail,
				error: cleanErrorIfAxios(error)
			},
			showToaster: true
		});
	} else {
		zrToaster.show({
			intent: "success",
			message: pluralize(tags.length, "tag", ` deleted from ${library}`)
		});
	}
}

/** Default hook for the zotero-roam:tags-modified event
 * @param {CustomEvent} event - The custom event emitted by the extension
 */
function tagsModified(event: CustomEvent<Events.TagsModified>){
	/* eslint-disable-next-line prefer-const */
	let { data: { failed, successful }, error, library } = event.detail;

	error = cleanErrorIfAxios(error);

	if (error || (failed.length > 0 && successful.length == 0)) {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Tag modification failed",
			context: {
				...event.detail,
				error
			},
			showToaster: true
		});
	} else {
		const itemsOutcome = successful.reduce((counts, res) => {
			counts.success += Object.keys(res.data.successful).length;
			counts.error += Object.keys(res.data.failed).length;
			return counts;
		}, { error: 0, success: 0 });

		const isFullSuccess = failed.length == 0 && itemsOutcome.error == 0;

		if (isFullSuccess) {
			zrToaster.show({
				intent: "success",
				message: pluralize(itemsOutcome.success, "item", ` successfully modified in ${library}.`)
			});
		} else {
			window.zoteroRoam?.warn?.({
				origin: "API",
				message: "",
				detail: `${pluralize(itemsOutcome.success, "item", "")} modified in ${library}, with some problems. \n Check the extension's logs for more details.`,
				context: {
					...event.detail,
					error
				},
				showToaster: true
			});
		}
	}
}

/** Default hook for the zotero-roam:write event
 * @param {CustomEvent} event - The custom event emitted by the extension
 */
function writeFinished(event: CustomEvent<Events.Write>){
	/* eslint-disable-next-line prefer-const */
	let { data, error, library } = event.detail;
	const { failed = [], successful = [] } = data;

	error = cleanErrorIfAxios(error);

	if (error || (failed.length > 0 && successful.length == 0)) {
		window.zoteroRoam?.error?.({
			origin: "API",
			message: "Error sending data to Zotero",
			context: {
				...event.detail,
				error
			},
			showToaster: true
		});
	} else {
		const itemsOutcome = successful.reduce((counts, res) => {
			counts.success += Object.keys(res.successful).length;
			counts.error += Object.keys(res.failed).length;
			return counts;
		}, { error: 0, success: 0 });

		const isFullSuccess = failed.length == 0 && itemsOutcome.error == 0;

		if (isFullSuccess) {
			zrToaster.show({
				intent: "success",
				message: pluralize(itemsOutcome.success, "item", ` added to ${library}.`)
			});
		} else {
			window.zoteroRoam?.warn?.({
				origin: "API",
				message: "Unsuccessful when sending data to Zotero",
				detail: `${pluralize(itemsOutcome.success, "item", "")} added to ${library}, with some problems. \n Check the extension's logs for more details.`,
				context: {
					...event.detail,
					error
				},
				showToaster: true
			});
		}
	}
}

/* istanbul ignore next */
/** Sets up default actions to trigger based on the extension's custom events.
 */
function setDefaultHooks(){
	document.addEventListener("zotero-roam:metadata-added", metadataAdded);
	document.addEventListener("zotero-roam:notes-added", notesAdded);
	document.addEventListener("zotero-roam:write", writeFinished);
	document.addEventListener("zotero-roam:tags-deleted", tagsDeleted);
	document.addEventListener("zotero-roam:tags-modified", tagsModified);
}

/* istanbul ignore next */
/** Cleans up all actions triggered on the extension's custom events.
 */
function clearDefaultHooks(){
	document.removeEventListener("zotero-roam:metadata-added", metadataAdded);
	document.removeEventListener("zotero-roam:notes-added", notesAdded);
	document.removeEventListener("zotero-roam:write", writeFinished);
	document.removeEventListener("zotero-roam:tags-deleted", tagsDeleted);
	document.removeEventListener("zotero-roam:tags-modified", tagsModified);
}

export {
	emitCustomEvent,
	metadataAdded,
	notesAdded,
	tagsDeleted,
	tagsModified,
	writeFinished,
	setDefaultHooks,
	clearDefaultHooks
};
