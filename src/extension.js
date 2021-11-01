;(()=>{
    zoteroRoam.extension = {

        /** Turns the extension 'on'
         * @fires zotero-roam:ready */
        async load(){
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            let requestReturns = await zoteroRoam.handlers.requestData(zoteroRoam.config.requests);
            if (!requestReturns.success) {
                zoteroRoam.interface.icon.style = `background-color:#f9a3a3 !important`;
                zoteroRoam.interface.popToast(message = "There was a problem with the Zotero data request. Please check your specification !", intent = "danger");
                throw new Error("The API request encountered a problem. Please check your request specification, and the console for any registered errors.");
            } else {
                try{
                    let keyCalls = [];
                    Array.from(new Set(zoteroRoam.config.requests.map(req => req.apikey))).forEach(key => {
                        keyCalls.push(fetch(`https://api.zotero.org/keys/${key}`, {method: 'GET', headers: {'Zotero-API-Version': 3, 'Zotero-API-Key': key}}));
                    })
                    let keyResults = await Promise.all(keyCalls);
                    keyResults = await Promise.all(keyResults.map(res => res.json()));
                    keyResults = keyResults.flat(1);
                    zoteroRoam.data.keys = keyResults;
                } catch(e){ console.error(e) };

                zoteroRoam.data.items = requestReturns.data.items;
                zoteroRoam.data.collections = requestReturns.data.collections;
                zoteroRoam.interface.icon.setAttribute("status", "on");

                // Setup the checking of citekey page references :
                zoteroRoam.inPage.checkReferences(); // initial
                document.addEventListener('blur', zoteroRoam.inPage.checkReferences, true); // on blur
                window.addEventListener('locationchange', zoteroRoam.inPage.checkReferences, true); // URL change
                zoteroRoam.config.ref_checking = setInterval(zoteroRoam.inPage.checkReferences, 1000); // continuous

                // Setup page menus :
                zoteroRoam.utils.sleep(100);
                zoteroRoam.inPage.addPageMenus(wait = 0); // initial
                window.addEventListener('locationchange', zoteroRoam.inPage.addPageMenus, true); // URL change
                zoteroRoam.config.page_checking = setInterval(function(){zoteroRoam.inPage.addPageMenus(wait = 0)}, 1000); // continuous

                // Setup exploratory search buttons :
                if(zoteroRoam.config.userSettings.webimport){
                    zoteroRoam.config.tag_checking = setInterval(function(){zoteroRoam.inPage.addWebImport()}, 1000); // continuous
                }

                // Auto-update ?
                if(zoteroRoam.config.userSettings.autoupdate){
                    zoteroRoam.config.auto_update = setInterval(function(){zoteroRoam.extension.update(popup = false)}, 60000); // Update every 60s
                }

                // Render citekey refs as inline citations ?
                if(zoteroRoam.config.userSettings.render_inline){
                    zoteroRoam.config.render_inline = setInterval(function(){ zoteroRoam.inPage.renderCitekeyRefs()}, 1000); // continuous
                }

                // Setup the search autoComplete object
                if(zoteroRoam.librarySearch.autocomplete == null){
                    zoteroRoam.librarySearch.autocomplete = new autoComplete(zoteroRoam.config.autoComplete);
                } else {
                    zoteroRoam.librarySearch.autocomplete.init();
                }
                // Setup observer for autocompletion tribute
                if(zoteroRoam.config.params.autocomplete.enabled == true){
                    zoteroRoam.config.editingObserver = new MutationObserver(zoteroRoam.interface.checkEditingMode);
                    zoteroRoam.config.editingObserver.observe(document, { childList: true, subtree: true});
                }
                // Setup the tag selection autoComplete (citations panel)
                if(zoteroRoam.tagSelection.cit_panel == null){
                    zoteroRoam.tagSelection.cit_panel = zoteroRoam.config.tagSelection(selector = "#zotero-roam-tagselector_citations", index = "cit_panel");
                } else {
                    zoteroRoam.tagSelection.cit_panel.init();
                }
                // Setup the tag selection autoComplete (auxiliary panel)
                if(zoteroRoam.tagSelection.aux_panel == null){
                    zoteroRoam.tagSelection.aux_panel = zoteroRoam.config.tagSelection(selector = "#zotero-roam-tagselector_auxiliary", index = "aux_panel");
                } else {
                    zoteroRoam.tagSelection.aux_panel.init();
                }
                // Setup contextmenu event for the extension's icon
                zoteroRoam.interface.icon.addEventListener("contextmenu", zoteroRoam.interface.popIconContextMenu);
                // Setup keypress listeners to detect shortcuts
                window.addEventListener("keyup", zoteroRoam.shortcuts.verify);
                window.addEventListener("keydown", zoteroRoam.shortcuts.verify);

                // Adding search panel to Roam Palette
                roamAlphaAPI.ui.commandPalette.addCommand({
                    label: 'zoteroRoam : Open the search panel', 
                    callback: () => {
                        zoteroRoam.interface.toggleSearchOverlay("show");
                    }
                });

                // Adding SmartBlocks commands
                zoteroRoam.smartblocks.registerCommands();

                /**
                 * Ready event
                 * 
                 * @event zotero-roam:ready
                 * @type {object}
                 */
                zoteroRoam.events.emit('ready', detail = zoteroRoam.data);
                zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                zoteroRoam.interface.popToast(message = "Zotero data successfully loaded !", intent = "success");
                console.log('The results of the API request have been received ; you can check them by inspecting the value of the zoteroRoam.data object. Data import context menu should now be available.');

            }
        },

        /** Turns the extension 'off' */
        unload(){
            zoteroRoam.interface.icon.setAttribute("status", "off");
            zoteroRoam.data.items = [];
            zoteroRoam.data.collections = [];
            zoteroRoam.data.semantic.clear();
            zoteroRoam.data.keys = [];
            for(lib of zoteroRoam.data.libraries.keys()){
                zoteroRoam.data.libraries.get(lib).version = "0";
            }

            if(zoteroRoam.librarySearch.autocomplete !== null){
                zoteroRoam.librarySearch.autocomplete.unInit();
            }
            if(zoteroRoam.citations.autocomplete !== null){
                zoteroRoam.citations.autocomplete.unInit();
            }
            if(zoteroRoam.tagSelection.cit_panel !== null){
                zoteroRoam.tagSelection.cit_panel.unInit();
            }
            if(zoteroRoam.tagSelection.aux_panel !== null){
                zoteroRoam.tagSelection.aux_panel.unInit();
            }

            // Remove in-page menus
            Array.from(document.querySelectorAll(".zotero-roam-page-div")).forEach(div => div.remove());

            // Remove request results
            let refCitekeys = document.querySelectorAll("ref-citekey");
            refCitekeys.forEach(ck => { 
                ck.removeAttribute("data-zotero-bib"); 
                ck.querySelector(".rm-page-ref").removeEventListener("contextmenu", zoteroRoam.interface.popContextMenu)});
            zoteroRoam.interface.icon.removeEventListener("contextmenu", zoteroRoam.interface.popIconContextMenu);

            document.removeEventListener('blur', zoteroRoam.inPage.checkReferences, true);
            window.removeEventListener('locationchange', zoteroRoam.inPage.checkReferences, true);
            try { clearInterval(zoteroRoam.config.ref_checking) } catch(e){};
            try { clearInterval(zoteroRoam.config.page_checking) } catch(e){};
            try { clearInterval(zoteroRoam.config.tag_checking) } catch(e){};
            try { clearInterval(zoteroRoam.config.auto_update) } catch(e){};
            try { clearInterval(zoteroRoam.config.render_inline) } catch(e){};
            // Clean up ref citekeys rendering once more
            zoteroRoam.inPage.renderCitekeyRefs();
            try { zoteroRoam.config.editingObserver.disconnect() } catch(e){};
            window.removeEventListener("keyup", zoteroRoam.shortcuts.verify);
            window.removeEventListener("keydown", zoteroRoam.shortcuts.verify);

            // Removing search panel opening from Roam Palette
            roamAlphaAPI.ui.commandPalette.removeCommand({
                label: 'zoteroRoam : Open the search panel'
            });

            zoteroRoam.interface.icon.removeAttribute("style");
            zoteroRoam.interface.popToast(message = "All Zotero data was cleared. Bye for now !", intent = "success");
            console.log('Data and request outputs have been removed');
        },
        
        /** Toggles the state of the extension (on/off) */
        toggle(){
            if(zoteroRoam.interface.icon.getAttribute('status') == "off"){
                zoteroRoam.extension.load();
            } else {
                zoteroRoam.extension.unload();
            }
        },

        /** Checks for data updates for an Array of requests
         * @fires zotero-roam:update
         * @param {string} popup - Specifies if a toast should display the update's outcome
         * @param {{apikey: string, dataURI: string, library: string, name: string, params: string}[]} reqs - The data requests to retrieve updates for
         */
        async update(popup = "true", reqs = zoteroRoam.config.requests){
            // Turn the icon background to orange while we're updating the data
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            // For each request, get the latest version of any item that belongs to it
            let updateRequests = reqs.map(rq => {
                let latest = zoteroRoam.data.libraries.get(rq.library).version;
                let {apikey, dataURI, params: setParams, name, library} = rq;
                let paramsQuery = new URLSearchParams(setParams);
                paramsQuery.set('since', latest);
                setParams = paramsQuery.toString();
                return {
                    apikey: apikey,
                    dataURI: dataURI,
                    params: setParams,
                    name: name,
                    library: library
                };
            });
            let updateResults = await zoteroRoam.handlers.requestData(updateRequests, update = true, collections = true);
            if(updateResults.success == true){
                updateResults.data.collections.forEach(collection => {
                    let inStore = zoteroRoam.data.collections.findIndex(cl => cl.key == collection.key);
                    if(inStore == -1){
                        zoteroRoam.data.collections.push(collection);
                    } else {
                        zoteroRoam.data.collections[inStore] = collection;
                    }
                })
                
                let updatedItems = updateResults.data.items;
                if(updatedItems.length == 0){
                    if(popup) {
                        zoteroRoam.interface.popToast("No new items were found since the data was last loaded. Data on collections was refreshed.", "primary");
                    };
                    zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                } else {
                    let newItems = zoteroRoam.handlers.extractCitekeys(updatedItems);
                    let nbNewItems = newItems.length;
                    let nbModifiedItems = 0;

                    updatedItems.forEach(item => {
                        let duplicateIndex = zoteroRoam.data.items.findIndex(libItem => libItem.data.key == item.data.key & libItem.requestLabel == item.requestLabel);
                        if(duplicateIndex == -1){
                            zoteroRoam.data.items.push(item);
                        } else {
                            zoteroRoam.data.items[duplicateIndex] = item;
                            nbModifiedItems += 1;
                            nbNewItems -= 1;
                        }
                    });

                    zoteroRoam.inPage.checkCitekeys(update = true);
                    if(popup) {
                        zoteroRoam.interface.popToast(`${nbNewItems} new items and ${nbModifiedItems} modified items were added.`, "primary");
                    } else{
                        console.log(`${nbNewItems} new items and ${nbModifiedItems} modified items were added.`);
                    };
                    zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                }

            } else {
                if(popup){
                    zoteroRoam.interface.popToast("Something went wrong when updating the data. Check the console for any errors.", "warning");
                } else{
                    console.log("Something went wrong when updating the data. Check the console for any errors.");
                };
            }
            /** Update event
             * @event zotero-roam:update
             * @type {object}
             * @property {?boolean} success - Indicates if the update was successful
             * @property {array} requests - The data requests that were part of the update
             * @property {object} data - The updated data, if any
             */
            zoteroRoam.events.emit('update', {
                success: updateResults.success,
                requests: updateRequests,
                data: updateResults.data
            })
        }
    };
})();
