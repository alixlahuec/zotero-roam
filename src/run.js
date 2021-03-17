;(()=>{
    // This code will run on re/load
    // It contains the interactive portion of the setup (reading user specifications, and setting up certain objects accordingly)
    if (typeof(window.zoteroRoam_settings) !== 'undefined') {
        // Add DOM interface elements + set them up
        zoteroRoam.interface.create();
        zoteroRoam.interface.setup();
        zoteroRoam.addAutoCompleteCSS();

        zoteroRoam.config.userSettings = window.zoteroRoam_settings;

        // Check for additional settings
        // override_quickcopy
        let qc_override_key = zoteroRoam.config.userSettings['override_quickcopy'] || false;
        if(qc_override_key){
            zoteroRoam.config.params.override_quickcopy.key = qc_override_key;
            window.addEventListener("keydown", (e) => {
                if(e.key == zoteroRoam.config.params.override_quickcopy.key | e[zoteroRoam.config.params.override_quickcopy.key] == true){
                    zoteroRoam.config.params.override_quickcopy.overridden = true;
                }
            });
            window.addEventListener("keyup", (e) => {
                if(e.key == zoteroRoam.config.params.override_quickcopy.key | e[zoteroRoam.config.params.override_quickcopy.key] == false){
                    zoteroRoam.config.params.override_quickcopy.overridden = false;
                }
            })
        };
        // always_copy | quick_copy_format
        let {always_copy = false, quick_copy_format = false} = zoteroRoam.config.userSettings;
        if(always_copy == true){
            zoteroRoam.config.params.always_copy = always_copy;
        };
        if(quick_copy_format == true){
            zoteroRoam.config.params.quick_copy_format = quick_copy_format;
        }
        
        zoteroRoam.shortcuts.setup();
        zoteroRoam.shortcuts.setupSequences();
        zoteroRoam.handlers.setupUserRequests();

    } else {
        throw new Error("A zoteroRoam_settings object must be defined in order to use the extension. Read through the docs for basic setup examples.");
    }
})();
