import zrToaster from "./toaster";

const events = [
	/**
    * Signals a metadata import has terminated
    * @event zotero-roam:metadata-added
    * @type {object}
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
     * @property {Boolean} success - Indicates if the update was successful
     * @property {{apikey: String, dataURI: String, library: String, name: String, params: String}} request - The data request that yielded the update
     * @property {ZoteroItem[]|Object[]} [data] - The data contained in the update, if successful
     * @property {error} [error] - The error thrown during the update, if failed
     */
	"update",
	/**
     * Signals a data update for collections has terminated
     * @event zotero-roam:update-collections
     * @type {object}
     * @property {Boolean} success - Indicates if the update was successful
     * @property {{apikey: String, path: String}} - The library that yielded the update
     * @property {ZoteroCollection[]|Object[]} [data] - The data contained in the update, if successful
     * @property {error} [error] - The error thrown during the update, if failed
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

function setDefaultHooks(){
	document.addEventListener("zotero-roam:metadata-added", (e) => {
		let { error } = e.detail;
		if(error){
			zrToaster.show({
				intent: "danger",
				message: error
			});
		} else {
			// For testing
			console.log(e);
		}
	});
}

export {
	emitCustomEvent,
	setDefaultHooks
};
