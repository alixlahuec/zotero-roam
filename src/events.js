;(()=>{
    zoteroRoam.events = {
        // zotero-roam:ready
        // Signals the extension has loaded successfully
        // Emitted by : extension.load
        'ready': {},
        // zotero-roam:menu-ready
        // Signals a page menu has been rendered
        // Emitted by : inPage.addPageMenus
        'menu-ready': {},
        // zotero-roam:metadata-added
        // Signals a metadata import has terminated (successfully?)
        // Emitted by : handlers.importItemMetadata
        'metadata-added': {},
        // zotero-roam:notes-added
        // Signals a notes import has terminated (successfully?)
        // Emitted by : handlers.addItemNotes
        'notes-added': {},
        // zotero-roam:update
        // Signals the extension's dataset has been updated (successfully?)
        // Emitted by : extension.update
        'update': {},
        // zotero-roam:write
        // Signals a write call has terminated
        // Emitted by : handlers.importSelectedItems
        'write': {},
        emit(type, detail = {}, target = document){
            let e = new CustomEvent(`zotero-roam:${type}`, {bubbles: true, cancelable: true, detail: detail});
            if(zoteroRoam.config.userSettings.logEvents == true){
                console.log(e);
            }
            return target.dispatchEvent(e);
        }
    }
})();
