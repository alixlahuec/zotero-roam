;(()=>{
    // This code will run on re/load
    // It contains the interactive portion of the setup (reading user specifications, and setting up certain objects accordingly)
    if (typeof(window.zoteroRoam_settings) !== 'undefined') {
        // Add DOM interface elements + set them up
        zoteroRoam.interface.create();
        zoteroRoam.interface.setup();
        zoteroRoam.addAutoCompleteCSS();

        zoteroRoam.config.userSettings = window.zoteroRoam_settings;
        
        zoteroRoam.shortcuts.setup();
        zoteroRoam.handlers.setupUserRequests();

    } else {
        throw new Error("A zoteroRoam_settings object must be defined in order to use the extension. Read through the docs for basic setup examples.");
    }
})();

// Example of a settings object
/* window.zoteroRoam_settings = {
    dataRequests: [{name: "Personal library", apikey: "", dataURI: "", params: ""}],
    funcmap: {journalArticle: "customPaperFormat", book: "customBookFormat"},
    shortcuts: {
        toggleSearch: {altKey: true, 'p': true},
        toggleQuickCopy: {ctrlKey: true, 'm': true},
        importMetadata: {metaKey: true, 'a': true}
    }
} */
