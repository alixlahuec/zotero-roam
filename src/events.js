;(()=>{
    zoteroRoam.events = {
        /**
         * Signals the extensiom has loaded successfully
         * @event zoteroRoam:ready
         */
        'ready': {},
        /**
         * Signals a page menu has been rendered
         * @event zotero-roam:menu-ready
         */
        'menu-ready': {},
        /**
         * Signals a metadata import has terminated
         * @event zotero-roam:metadata-added
         */
        'metadata-added': {},
        /**
         * Signals a notes import has terminated
         * @event zotero-roam:notes-added
         */
        'notes-added': {},
        /**
         * Signals a data update has terminated
         * @event zotero-roam:update
         */
        'update': {},
        /**
         * Signals a write call has terminated
         * @event zotero-roam:write
         */
        'write': {},
        /**
         * Emits a custom event for the extension
         * @alias zoteroRoam.events.emit
         * @param {string} type - The suffix of the event to be emitted
         * @param {object} detail - The object containing the event's detail
         * @param {Element} target - The DOM target on which the event should be emitted 
         */
        emit(type, detail = {}, target = document){
            let e = new CustomEvent(`zotero-roam:${type}`, {bubbles: true, cancelable: true, detail: detail});
            if(zoteroRoam.config.userSettings.logEvents == true){
                console.log(e);
            }
            target.dispatchEvent(e);
        }
    }
})();
