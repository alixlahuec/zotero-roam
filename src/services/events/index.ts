import zrToaster from "Components/ExtensionToaster";

import { Events } from "./types";

import { cleanError, pluralize } from "../../utils";
import { DEFAULT_TOAST_TIMEOUT } from "../../constants";


/**
 * Emits a custom event for the extension
 * @param event - The object containing the event's details
 * @param target - The DOM target on which the event should be emitted
 */
function emitCustomEvent<T extends Events.Details = Events.Details>(event: T, target: Element | Document = document) {
	const e = new CustomEvent<T>(`zotero-roam:${event._type}`, { bubbles: true, cancelable: true, detail: event });
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
				error: cleanError(error)
			},
			showToaster: true
		});
	} else if (success) {
		zrToaster.show({
			intent: "success",
			message: "Metadata added to " + title,
			timeout: DEFAULT_TOAST_TIMEOUT
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
				error: cleanError(error)
			},
			showToaster: true
		});
	} else if (success) {
		zrToaster.show({
			intent: "success",
			message: "Notes added to " + title + ` (${notes.length})`,
			timeout: DEFAULT_TOAST_TIMEOUT
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
				error: cleanError(error)
			},
			showToaster: true
		});
	} else {
		zrToaster.show({
			intent: "success",
			message: pluralize(tags.length, "tag", ` deleted from ${library}`),
			timeout: DEFAULT_TOAST_TIMEOUT
		});
	}
}

/** Default hook for the zotero-roam:tags-modified event
 * @param {CustomEvent} event - The custom event emitted by the extension
 */
function tagsModified(event: CustomEvent<Events.TagsModified>){
	/* eslint-disable-next-line prefer-const */
	let { data: { failed, successful }, error, library } = event.detail;

	error = cleanError(error);

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
			counts.success += Object.keys(res.successful).length;
			counts.error += Object.keys(res.failed).length;
			return counts;
		}, { error: 0, success: 0 });

		const isFullSuccess = failed.length == 0 && itemsOutcome.error == 0;

		if (isFullSuccess) {
			zrToaster.show({
				intent: "success",
				message: pluralize(itemsOutcome.success, "item", ` successfully modified in ${library}.`),
				timeout: DEFAULT_TOAST_TIMEOUT
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

	error = cleanError(error);

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
				message: pluralize(itemsOutcome.success, "item", ` added to ${library}.`),
				timeout: DEFAULT_TOAST_TIMEOUT
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

export * from "./types";

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
