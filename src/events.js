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
    * @property {{item: ZoteroItem|Object, notes: Object[], pdfs: Object[]}} raw - The raw data provided as input
    * @property {Boolean|null} success - Indicates if the update was successful
    * @see importItemMetadata
    */
	"metadata-added",
	/**
    * Signals a notes import has terminated
    * @event zotero-roam:notes-added
    * @type {object}
    */
	"notes-added",
	/**
    * Signals a data update for items has terminated
     * @event zotero-roam:update
     * @type {object}
     * @property {ZoteroItem[]|Object[]} [data] - The data contained in the update, if successful
     * @property {error} [error] - The error thrown during the update, if failed
     * @property {{apikey: String, dataURI: String, library: String, name: String, params: String}} request - The data request that yielded the update
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
		let e = new CustomEvent(`zotero-roam:${type}`, {bubbles: true, cancelable: true, detail: detail});
		target.dispatchEvent(e);
	} else {
		console.warn(`Event type "${type}" is not recognized`);
	}
}

/** Sets up default actions to trigger based on the extension's custom events
 */
function setDefaultHooks(){
	document.addEventListener("zotero-roam:metadata-added", (e) => {
		let { error, success, title } = e.detail;
		if(error){
			console.error(error);
			zrToaster.show({
				intent: "danger",
				message: `Metadata import failed for ${title} : \n ${error}`
			});
		} else if(success){
			zrToaster.show({
				intent: "success",
				message: "Metadata added to" + title
			});
		} else {
			// For testing
			console.log(e);
		}
	});
	document.addEventListener("zotero-roam:write", (e) => {
		let { data, error, library } = e.detail;
		if(error){
			console.error(error);
			zrToaster.show({
				intent: "danger",
				message: `Import to Zotero failed : \n ${error}`
			});
		} else {
			zrToaster.show({
				intent: "success",
				message: pluralize(data?.successful?.length, "item", ` added to ${library}`)
			});
			// For debugging :
			console.log(data);
		}
	});
}

export {
	emitCustomEvent,
	setDefaultHooks
};
