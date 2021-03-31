;(()=>{
    zoteroRoam.extension = {

        async load(){
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            let requestReturns = await zoteroRoam.handlers.requestData(zoteroRoam.config.requests);
            if (!requestReturns.success) {
                zoteroRoam.interface.icon.style = `background-color:#f9a3a3 !important`;
                throw new Error("The API request encountered a problem. Please check your request specification, and the console for any registered errors.");
            } else {
                zoteroRoam.data.items = requestReturns.data.items;
                zoteroRoam.data.collections = requestReturns.data.collections;
                zoteroRoam.interface.icon.setAttribute("status", "on");
                // Setup the checking of citekey page references : initial, on blur, on page change
                zoteroRoam.pageRefs.checkReferences();
                document.addEventListener('blur', zoteroRoam.pageRefs.checkReferences, true);
                window.addEventListener('locationchange', zoteroRoam.pageRefs.checkReferences, true);
                zoteroRoam.config.ref_checking = setInterval(zoteroRoam.pageRefs.checkReferences, 1000);
                // Setup the search autoComplete object
                if(zoteroRoam.autoComplete == null){
                    zoteroRoam.autoComplete = new autoComplete(zoteroRoam.config.autoComplete);
                } else {
                    zoteroRoam.autoComplete.init();
                }
                zoteroRoam.config.autoComplete.trigger.event.forEach(ev => {
                    zoteroRoam.interface.search.input.addEventListener(ev, zoteroRoam.interface.clearSelectedItem);
                })
                // Setup observer for autocompletion tribute
                if(zoteroRoam.config.params.autocomplete.enabled == true){
                    zoteroRoam.config.editingObserver = new MutationObserver(zoteroRoam.interface.checkEditingMode);
                    zoteroRoam.config.editingObserver.observe(document, { childList: true, subtree: true});
                }
                // Setup contextmenu event for the extension's icon
                zoteroRoam.interface.icon.addEventListener("contextmenu", zoteroRoam.interface.popIconContextMenu);
                // Setup keypress listeners to detect shortcuts
                window.addEventListener("keyup", zoteroRoam.shortcuts.verify);
                window.addEventListener("keydown", zoteroRoam.shortcuts.verify);

                zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                console.log('The results of the API request have been received ; you can check them by inspecting the value of the zoteroRoam.data object. Data import context menu should now be available.');

            }
        },

        unload(){
            zoteroRoam.interface.icon.setAttribute("status", "off");
            zoteroRoam.data = {items: [], collections: []};
            if(zoteroRoam.autoComplete !== null){
                zoteroRoam.autoComplete.unInit();
            }

            // Remove request results
            let refCitekeys = document.querySelectorAll("ref-citekey");
            refCitekeys.forEach(ck => { 
                ck.removeAttribute("data-zotero-bib"); 
                ck.querySelector(".rm-page-ref").removeEventListener("contextmenu", zoteroRoam.interface.popContextMenu)});
            zoteroRoam.interface.icon.removeEventListener("contextmenu", zoteroRoam.interface.popIconContextMenu);

            document.removeEventListener('blur', zoteroRoam.pageRefs.checkReferences, true);
            window.removeEventListener('locationchange', zoteroRoam.pageRefs.checkReferences, true);
            try { clearInterval(zoteroRoam.config.ref_checking) } catch(e){};
            zoteroRoam.config.editingObserver.disconnect();
            window.removeEventListener("keyup", zoteroRoam.shortcuts.verify);
            window.removeEventListener("keydown", zoteroRoam.shortcuts.verify);

            zoteroRoam.interface.icon.removeAttribute("style");
            console.log('Data and request outputs have been removed');
        },
        
        toggle(){
            if(zoteroRoam.interface.icon.getAttribute('status') == "off"){
                zoteroRoam.extension.load();
            } else {
                zoteroRoam.extension.unload();
            }
        },

        async update(){
            // Turn the icon background to orange while we're updating the data
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            // For each request, get the latest version of any item that belongs to it
            let updateRequests = zoteroRoam.config.requests.map(rq => {
                let items = zoteroRoam.data.items.filter(i => i.requestLabel == rq.name);
                let latest = items.reduce( (f,s) => {return (f.version < s.version) ? s : f}).version;
                let {apikey, dataURI, params: setParams} = rq;
                let paramsQuery = new URLSearchParams(setParams);
                paramsQuery.set('since', latest);
                setParams = paramsQuery.toString();
                return {
                    apikey: apikey,
                    dataURI: dataURI,
                    params: setParams
                };
            });
            let updateResults = await zoteroRoam.handlers.requestData(updateRequests);
            if(updateResults.success == true){
                zoteroRoam.data.collections = updateResults.data.collections; // Collections are fetched without a 'since' parameter, so simply replacing the whole Object is fine
                
                let updatedItems = updateResults.data.items;
                if(updatedItems.length == 0){
                    alert("No new items were found since the data was last loaded. Data on collections was refreshed.");
                    zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                } else {
                    let newItems = zoteroRoam.handlers.extractCitekeys(updatedItems);
                    let nbNewItems = newItems.length;
                    let nbModifiedItems = 0;

                    updatedItems.forEach(item => {
                        let duplicateIndex = zoteroRoam.data.items.findIndex(libItem => {return libItem.key == item.key & libItem.requestLabel == item.requestLabel});
                        if(duplicateIndex == -1){
                            zoteroRoam.data.items.push(item);
                        } else {
                            zoteroRoam.data.items[duplicateIndex] = item;
                            nbModifiedItems += 1;
                            nbNewItems -= 1;
                        }
                    });

                    zoteroRoam.pageRefs.checkCitekeys(update = true);
                    alert(`${nbNewItems} new items and ${nbModifiedItems} modified items were added to the dataset. Data on collections was refreshed.`)
                    zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                }

            } else {
                alert("Something went wrong when updating the data. Check the console for any errors.");
            }
        }
    };
})();
