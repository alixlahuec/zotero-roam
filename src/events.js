import zrToaster from "./components/ExtensionToaster";

import { pluralize } from "./utils";


const events = [
	/**
    * Signals a metadata import has terminated
    * @event zotero-roam:metadata-added
    * @type {object}
    * @property {({blocks: Array, uid: String}|{new: Boolean, smartblock: Object, uid: String})} args - The configuration used for the import
    * @property {error|null} error - The error thrown during the import, if failed
	* @property {{new: Boolean, title: String, uid: String}} page - The details about the Roam page for the item
    * @property {{item: ZoteroItem, notes: (ZoteroItem|ZoteroAnnotation)[], pdfs: ZoteroItem[]}} raw - The raw data provided as input
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
	* @property {{item: ZoteroItem, notes: (ZoteroItem|ZoteroAnnotation)[]}} raw - The raw data provided as input
	* @property {Boolean|null} success - Indicates if the update was successful
	* @see importItemNotes
    */
	"notes-added",
	/**
	 * Signals a tag deletion has terminated
	 * @event zotero-roam:tags-deleted
	 * @type {object}
	 * @property {error|null} error - The error thrown during the import, if failed
	 * @property {String} library - The path of the targeted library
	 * @property {String[]} tags - The array of targeted tags
	 * @see useDeleteTags
	 */
	"tags-deleted",
	/**
	 * Signals a tag modification has terminated
	 * @event zotero-roam:tags-modified
	 * @type {object}
	 * @property {{failed: Object[], successful: Object[]}} data - The outcome of all requests
	 * @property {error|null} error - The error thrown during the modification, if failed
	 * @property {String} into - The string used for the renaming
	 * @property {String} library - The path of the targeted library
	 * @property {String[]} tags - The array of targeted tags
	 * @see useModifyTags
	 */
	"tags-modified",
	/**
    * Signals a data update for items has terminated
     * @event zotero-roam:update
     * @type {object}
     * @property {ZoteroItem[]} [data] - The data contained in the update, if successful
     * @property {error} [error] - The error thrown during the update, if failed
     * @property {DataRequest} request - The data request that yielded the update
     * @property {Boolean} success - Indicates if the update was successful
     */
	"update",
	/**
     * Signals a data update for collections has terminated
     * @event zotero-roam:update-collections
     * @type {object}
     * @property {ZoteroCollection[]|Object[]} [data] - The data contained in the update, if successful
     * @property {error} [error] - The error thrown during the update, if failed
     * @property {{apikey: String, path: String}} library - The library that yielded the update
     * @property {Boolean} success - Indicates if the update was successful
     */
	"update-collections",
	/**
    * Signals a write call has terminated
    * @event zotero-roam:write
    * @type {object}
    */
	"write"];

/**
 * Emits a custom event for the extension
 * @param {string} type - The suffix of the event to be emitted
 * @param {object} detail - The object containing the event's detail
 * @param {Element} target - The DOM target on which the event should be emitted
 */
function emitCustomEvent(type, detail = {}, target = document){
	if(events.includes(type)){
		const e = new CustomEvent(`zotero-roam:${type}`, { bubbles: true, cancelable: true, detail: detail });
		target.dispatchEvent(e);
	} else {
		console.warn(`Event type "${type}" is not recognized`);
	}
}

/* istanbul ignore next */
/** Sets up default actions to trigger based on the extension's custom events
 */
function setDefaultHooks(){
	document.addEventListener("zotero-roam:metadata-added", (e) => {
		const { error, page: { title }, success } = e.detail;
		if(error){
			console.error(error);
			zrToaster.show({
				intent: "danger",
				message: `Metadata import failed for ${title} : \n ${error}`
			});
		} else if(success){
			zrToaster.show({
				intent: "success",
				message: "Metadata added to " + title
			});
		} else {
			// ? For testing
			console.log(e);
		}
	});
	document.addEventListener("zotero-roam:notes-added", (e) => {
		const { error, page: { title }, raw: { notes }, success } = e.detail;
		if(error){
			console.error(error);
			zrToaster.show({
				intent: "danger",
				message: `Notes import failed for ${title} : \n ${error}`
			});
		} else if(success){
			zrToaster.show({
				intent: "success",
				message: "Notes added to " + title + ` (${notes.length})`
			});
		} else {
			// ? For testing
			console.log(e);
		}
	});
	document.addEventListener("zotero-roam:write", (e) => {
		// ! For debugging:
		console.log(e.detail);
		const { data: { failed, successful }, error, library } = e.detail;
		if(error){ console.error(error); }
		if(failed.length > 0){ console.log(failed); }

		if(error || (failed.length > 0 && successful.length == 0)){
			zrToaster.show({
				intent: "danger",
				message: `Import to Zotero failed : \n ${[error, failed].filter(Boolean).join("\n")}`
			});
		} else {
			const itemsOutcome = successful.reduce((counts, res) => {
				counts.success += Object.keys(res.data.successful).length;
				counts.error += Object.keys(res.data.failed).length;
			}, { error: 0, success: 0 });
			// ! For debugging:
			console.log(itemsOutcome);
			const isFullSuccess = failed.length == 0 && itemsOutcome.error == 0;

			if(isFullSuccess){
				zrToaster.show({
					intent: "success",
					message: pluralize(itemsOutcome.success, "item", ` added to ${library}.`)
				});
			} else {
				zrToaster.show({
					intent: "primary",
					message: `${pluralize(itemsOutcome.success, "item", "")} added to ${library}, with some problems (${pluralize(itemsOutcome.error, "failed modification", "")}, ${pluralize(failed.length, "failed request", "")}). \n Please check the browser's console for more details.`
				});
			}
		}
	});
	document.addEventListener("zotero-roam:tags-deleted", (e) => {
		const { error, library, tags } = e.detail;
		if(error){
			console.error(error);
			zrToaster.show({
				intent: "danger",
				message: `Tag deletion failed : \n ${error}`
			});
		} else {
			zrToaster.show({
				intent: "success",
				message: pluralize(tags.length, "tag", ` deleted from ${library}`)
			});
		}
	});
	document.addEventListener("zotero-roam:tags-modified", (e) => {
		const { data: { failed, successful }, error, library } = e.detail;
		if(error){ console.error(error); }
		if(failed.length > 0){ console.log(failed); }

		if(error || (failed.length > 0 && successful.length == 0)){
			zrToaster.show({
				intent: "danger",
				message: `Tag modification failed : \n ${[error, failed].filter(Boolean).join("\n")}`
			});
		} else {
			const itemsOutcome = successful.reduce((counts, res) => {
				counts.success += Object.keys(res.data.successful).length;
				counts.error += Object.keys(res.data.failed).length;
				return counts;
			}, { error: 0, success: 0 });
			const isFullSuccess = failed.length == 0 && itemsOutcome.error == 0;

			if(isFullSuccess){
				zrToaster.show({
					intent: "success",
					message: pluralize(itemsOutcome.success, "item", ` successfully modified in ${library}.`)
				});
			} else {
				zrToaster.show({
					intent: "primary",
					message: `${pluralize(itemsOutcome.success, "item", "")} modified in ${library}, with some problems (${pluralize(itemsOutcome.error, "failed modification", "")}, ${pluralize(failed.length, "failed request", "")}). \n Please check the browser's console for more details.`
				});
			}
		}
	});
}

export {
	emitCustomEvent,
	setDefaultHooks
};
