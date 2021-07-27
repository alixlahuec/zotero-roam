;(()=>{
    // This code will run on re/load
    // It contains the interactive portion of the setup (reading user specifications, and setting up certain objects accordingly)
    if (typeof(window.zoteroRoam_settings) !== 'undefined') {
        // Get user settings
        zoteroRoam.config.userSettings = window.zoteroRoam_settings;
        if(zoteroRoam.config.userSettings.theme){
            zoteroRoam.config.params.theme = zoteroRoam.config.userSettings.theme;
        }
        // Add DOM interface elements + set them up
        zoteroRoam.interface.create();
        zoteroRoam.interface.setup();
        zoteroRoam.addExtensionCSS();
        window.addEventListener("hashchange", () => { zoteroRoam.interface.toggleSearchOverlay("hide") });

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
        let {always_copy = false, quick_copy_format = 'citekey'} = zoteroRoam.config.userSettings;
        zoteroRoam.config.params.always_copy = always_copy;
        zoteroRoam.config.params.quick_copy_format = quick_copy_format;

        if(zoteroRoam.config.userSettings.autocomplete){
            let {format = 'citation', trigger = '', display = 'citekey'} = zoteroRoam.config.userSettings.autocomplete;
            zoteroRoam.config.params.autocomplete.format = format;
            zoteroRoam.config.params.autocomplete.display = display;
            if(trigger.length > 0){
                zoteroRoam.config.tribute.trigger = trigger;
                zoteroRoam.config.params.autocomplete.enabled = true;
            }
        }

        if(zoteroRoam.config.userSettings.notes){
            let {use = "text", split_char = "\n", func = "zoteroRoam.utils.formatItemNotes"} = zoteroRoam.config.userSettings.notes;
            zoteroRoam.config.params.notes.use = use;
            zoteroRoam.config.params.notes["split_char"] = split_char;
            zoteroRoam.config.params.notes.func = func;
        }

        if(zoteroRoam.config.userSettings.pageMenu){
            let {defaults, trigger} = zoteroRoam.config.userSettings.pageMenu;
            if(defaults){ zoteroRoam.config.params.pageMenu.defaults = defaults };
            if(trigger && typeof(trigger) == "function"){ zoteroRoam.config.params.pageMenu.trigger = trigger };
        }
        
        zoteroRoam.shortcuts.setup();
        zoteroRoam.shortcuts.setupSequences();
        zoteroRoam.handlers.setupUserRequests();
        zoteroRoam.events.defaultHooks();

        if(zoteroRoam.config.userSettings.autoload == true){
            setTimeout(function(){zoteroRoam.extension.load()}, 1000);
        }

    } else {
        throw new Error("A zoteroRoam_settings object must be defined in order to use the extension. Read through the docs for basic setup examples.");
    }
})();
