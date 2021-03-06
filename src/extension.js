;(()=>{
    zoteroRoam.extension = {

        async load(){
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            let requestReturns = await zoteroRoam.handlers.requestData(zoteroRoam.config.requests);
            if (!requestReturns.success) {
                throw new Error("The API request encountered a problem. Please check your request specification, and the console for any registered errors.");
            } else {
                zoteroRoam.data.items = requestReturns.data.items;
                zoteroRoam.data.collections = requestReturns.data.collections;
                zoteroRoam.interface.icon.setAttribute("status", "on");
                // Setup the checking of citekey page references : initial, on blur, on page change
                zoteroRoam.pageRefs.checkReferences();
                document.addEventListener('blur', zoteroRoam.pageRefs.checkReferences, true);
                window.addEventListener('locationchange', zoteroRoam.pageRefs.checkReferences, true);
                // Setup the search autoComplete object
                if(zoteroRoam.autoComplete == null){
                    zoteroRoam.autoComplete = new autoComplete(zoteroRoam.config.autoComplete);
                } else {
                    zoteroRoam.autoComplete.init();
                }
                zoteroRoam.config.autoComplete.trigger.event.forEach(ev => {
                    zoteroRoam.interface.search.input.addEventListener(ev, zoteroRoam.interface.clearSelectedItem);
                })
                // Setup contextmenu event for the extension's icon
                zoteroRoam.interface.icon.addEventListener("contextmenu", handlerIcon = function(e){ zoteroRoam.interface.popContextOverlay(e, elementKey = "iconContextMenu") });
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
            zoteroRoam.autoComplete.unInit();

            // Remove request results
            let refCitekeys = document.querySelectorAll("ref-citekey");
            refCitekeys.forEach(ck => { 
                ck.removeAttribute("data-zotero-bib"); 
                ck.querySelector(".rm-page-ref").removeEventListener("contextmenu", handler)});
            zoteroRoam.interface.icon.removeEventListener("contextmenu", handlerIcon);

            document.removeEventListener('blur', zoteroRoam.pageRefs.checkReferences, true);
            window.removeEventListener('locationchange', zoteroRoam.pageRefs.checkReferences, true);
            window.removeEventListener("keyup", zoteroRoam.shortcuts.verify);
            window.removeEventListener("keydown", zoteroRoam.shortcuts.verify);

            zoteroRoam.interface.icon.removeAttribute("style");
            console.log('Data and request outputs have been removed');
        },
        
        toggle(){
            if(zoteroRoam.interface.icon.status == "off"){
                zoteroRoam.extension.load();
            } else {
                zoteroRoam.extension.unload();
            }
        },

        update(){
            // Turn the icon background to orange while we're updating the data
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            // For each request, get the latest version of any item that belongs to it
            let updateRequests = zoteroRoam.config.requests.map(rq => {
                let items = zoteroRoam.data.items.filter(i => i.requestLabel == rq.name);
                let latest = items.reduce( (f,s) => {return (f.version < s.version) ? s : f});
                let paramsQuery = new URLSearchParams(rq.params);
                paramsQuery.set('since', latest);
                rq.params = paramsQuery.toString();
                return rq;
            });
            let updateResults = await zoteroRoam.handlers.requestData(updateRequests);
            if(updateResults.success == true){
                zoteroRoam.data.collections = updateResults.map(res => res.data.collections).flat(1); // Collections are fetched without a 'since' parameter, so simply replacing the whole Object is fine
                
                let updatedItems = updateResults.map(res => res.data.items);
                let notEmpty = updatedItems.find(res => res.length > 0);
                if(!notEmpty){
                    alert("No new items were found since the data was last loaded. Data on collections was refreshed.");
                    zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                } else {
                    let resultsMessage = zoteroRoam.config.requests.map( (rq, rq_index) => {
                        newItems = zoteroRoam.handlers.extractCitekeys(updatedItems[i]);
                        let nbNewItems = newItems.length;
                        let nbModifiedItems = 0;
    
                        newItems.forEach(item => {
                            item.requestLabel = rq.name;
                            item.requestIndex = rq_index;
                            let duplicateIndex = zoteroRoam.data.items.findIndex(libItem => {return libItem.key == item.key});
                            if(duplicateIndex == -1){
                                zoteroRoam.data.items.push(item);
                            } else {
                                zoteroRoam.data.items[duplicateIndex] = item;
                                nbModifiedItems += 1;
                                nbNewItems -= 1;
                            }
                        });
    
                        zoteroRoam.pageRefs.checkCitekeys(update = true);
    
                        if(newItems.length == 0){
                            return `${rq.name} : no new items`;
                        }
                        return `${rq.name} : ${nbNewItems} new items, ${nbModifiedItems} modified items`;
    
                    });
    
                    resultsMessage.join(" \n ");
                    alert(`${resultsMessage}`);
                    zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                }

            } else {
                alert("Something went wrong when updating the data. Check the console for any errors.");
            }
        }
    };
});
