import zrToaster from "Components/ExtensionToaster";

import { cleanErrorIfAxios } from "./api/utils";
import { pluralize } from "./utils";


const events = [
	/**
    * Signals a metadata import has terminated
    * @event zotero-roam:metadata-added
    * @type {object}
    * @property {({blocks: Array, uid: String}|{smartblock: SBConfig, uid: String})} args - The configuration used for the import
    * @property {error|null} error - The error thrown during the import, if failed
	* @property {{new: Boolean, title: String, uid: String}} page - The details about the Roam page for the item
    * @property {{item: ZoteroAPI.ItemTop, notes: (ZoteroAPI.ItemNote|ZoteroAPI.ItemAnnotation)[], pdfs: ZoteroAPI.ItemAttachment[]}} raw - The raw data provided as input
    * @property {Boolean|null} success - Indicates if the update was successful
    * @see importItemMetadata
    */
	"metadata-added",
	/**
    * Signals a notes import has terminated
    * @event zotero-roam:notes-added
    * @type {object}
	* @property {{blocks: Array, uid: String}} args - The configuration used for the import
	* @property {error|null} error - The error thrown during the import, if failed
	* @property {{new: Boolean, title: String, uid: String}} page - The details about the Roam page for the item
	* @property {{item: ZoteroAPI.ItemTop, notes: (ZoteroAPI.ItemNote|ZoteroAPI.ItemAnnotation)[]}} raw - The raw data provided as input
	* @property {Boolean|null} success - Indicates if the update was successful
	* @see importItemNotes
    */
	"notes-added",
	/**
	 * Signals a tag deletion has terminated
	 * @event zotero-roam:tags-deleted
	 * @type {object}
	 * @property {*} data - The data received, if successful
     * @property {{tags: String[]}} args - The input provided to the deleting function
	 * @property {error|null} error - The error thrown during the import, if failed
	 * @property {String} library - The path of the targeted library
	 * @see useDeleteTags
	 */
	"tags-deleted",
	/**
	 * Signals a tag modification has terminated
	 * @event zotero-roam:tags-modified
	 * @type {object}
     * @property {{into: String, tags: String[]}} args - The input provided to the modifying function
	 * @property {{successful: Object[], failed: Object[]}} data - The outcome of all requests
	 * @property {error|null} error - The error thrown during the modification, if failed
	 * @property {String} library - The path of the targeted library
	 * @see useModifyTags
	 */
	"tags-modified",
	/**
    * Signals a data update has terminated
     * @event zotero-roam:update
     * @type {object}
     * @property {((ZoteroAPI.Item)[])|(ZoteroAPI.Collection[])|null} data - The data contained in the update, if successful
     * @property {error|null} error - The error thrown during the update, if failed
     * @property {String} library - The path of the library that yielded the update
     * @property {Integer} since - The library version since which elements were retrieved
     * @property {Boolean} success - Indicates if the update was successful
     * @property {("items"|"collections")} type - The data type targeted by the update
     */
	"update",
	/**
    * Signals a write call has terminated
    * @event zotero-roam:write
    * @type {object}
    * @property {{collections: String[], items: Object[], tags: String[]}} args - The input provided to the writing function
    * @property {{successful: Object[], failed: Object[]}|null} data - The outcome of the operation
    * @property {error|null} error - The error thrown during the operation, if any
    * @property {String} library - The path of the targeted library
    */
	"write"
];

/**
 * Emits a custom event for the extension
 * @param {string} type - The suffix of the event to be emitted
 * @param {object} detail - The object containing the event's detail
 * @param {Element|Document} target - The DOM target on which the event should be emitted
 */
function emitCustomEvent(type, detail = {}, target = document){
	if(events.includes(type)){
		const e = new CustomEvent(`zotero-roam:${type}`, { bubbles: true, cancelable: true, detail: detail });
		target.dispatchEvent(e);
	} else {
		window.zoteroRoam?.warn?.({
			origin: "Extension",
			message: `Event type "${type}" not recognized`,
			context: detail
		});
	}
}

/** Default hook for the zotero-roam:metadata-added event
 * @param {CustomEvent} event - The custom event emitted by the extension
 */
function metadataAdded(event){
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

/** Default hook for the zotero-roam:notes-added event
 * @param {CustomEvent} event - The custom event emitted by the extension
 */
function notesAdded(event){
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
function tagsDeleted(event){
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
function tagsModified(event){
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
function writeFinished(event){
	/* eslint-disable-next-line prefer-const */
	let { data: { failed, successful }, error, library } = event.detail;

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
			counts.success += Object.keys(res.data.successful).length;
			counts.error += Object.keys(res.data.failed).length;
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
