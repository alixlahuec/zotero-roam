;(()=>{
    zoteroRoam.write = {

        async patchItemData(item, dataObj){
            let itemRequest = zoteroRoam.config.requests.find(c => c.name == item.requestLabel);
            let userOrGroupPrefix = itemRequest.dataURI.match(/(users|groups)\/(.+?)\//g)[0].slice(0,-1);
            let req = await fetch(`https://api.zotero.org/${userOrGroupPrefix}/items/${item.data.key}`, {
                method: 'PATCH',
                body: JSON.stringify(dataObj),
                headers: {
                    'Zotero-API-Version': 3,
                    'Zotero-API-Key': itemRequest.apikey,
                    'If-Unmodified-Since-Version': item.version
                }
            });

            if(req.status == 204){
                let patchVersion = req.headers.get('Last-Modified-Version');
                zoteroRoam.data.items.find(it => it.key == item.key).version = patchVersion;
                return {
                    success: true,
                    version: patchVersion
                }
            } else {
                return {
                    success: false,
                    response: req
                }
            }
        },

        async editItemTags(item, {add = [], remove = []} = {}){
            let currentTags = item.data.tags.map(t => t.tag);
            let newTags = currentTags.filter(t => !remove.includes(t)).push(...add).map(t => { return {tag: t} });

            let patchReq = await zoteroRoam.write.patchItemData(item, {tags: newTags});

            return patchReq;
        },

        async toggleTags(item, tags = []){
            let itemTags = item.data.tags.map(t => t.tag);
            if(tags.length > 1){
                let tagIndex = -1;
                tags.forEach((t,i) => {
                    if(tagIndex == -1){
                        tagIndex = (itemTags.includes(t) ? i : -1);
                    } else {
                        return;
                    }
                });
                let patchReq = {};
                if(tagIndex == -1){
                    patchReq = await zoteroRoam.write.editItemTags(item, {add: [tags[0]]});
                } else if(tagIndex == tags.length - 1) {
                    patchReq = await zoteroRoam.write.editItemTags(item, {add: [tags[0]], remove: tags.slice(1)});
                } else {
                    patchReq = await zoteroRoam.write.editItemTags(item, {add: [tags[tagIndex]], remove: tags.filter(t != tags[tagIndex])});
                }

                if(patchReq.success == true){
                    return tags[tagIndex];
                }
            }
        },

        async importItems(data, library, retry = true){
            data = (data.constructor === Array) ? data : [data];
            let outcome = {};
            try{
                let libIndex = zoteroRoam.data.libraries.findIndex(lib => lib.path == library.path);
                let req = await fetch(`https://api.zotero.org/${library.path}/items`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        'Zotero-API-Version': 3,
                        'Zotero-API-Key': library.apikey,
                        'If-Unmodified-Since-Version': library.version
                    }
                });
                if(req.ok == true){
                    // If the request returned a successful API response, log the data & update global info
                    let reqResults = await req.json();
                    // Update the extension's information on library version
                    zoteroRoam.data.libraries[libIndex].version = req.headers.get('Last-Modified-Version');
                    zoteroRoam.interface.activeImport.libraries = zoteroRoam.utils.getLibraries();
                    zoteroRoam.interface.activeImport.currentLib = zoteroRoam.interface.activeImport.libraries.find(lib => lib.path == zoteroRoam.interface.activeImport.currentLib.path);
                    zoteroRoam.utils.sleep(1000);
                    reqResults.successful = await zoteroRoam.write.checkImport(reqResults.successful);
                    outcome = {
                        success: true,
                        data: reqResults
                    }
                } else {
                    // If the API response is a 412 error (Precondition Failed), update data + try again once
                    if(req.status == 412 && retry == true){
                        await zoteroRoam.extension.update(popup = false, reqs = zoteroRoam.config.requests.filter(rq => rq.library == library.path));
                        // Update the lib data for the active import
                        zoteroRoam.interface.activeImport.libraries = zoteroRoam.utils.getLibraries();
                        zoteroRoam.interface.activeImport.currentLib = zoteroRoam.interface.activeImport.libraries.find(lib => lib.path == zoteroRoam.interface.activeImport.currentLib.path);

                        outcome = await zoteroRoam.write.importItems(data, library = zoteroRoam.interface.activeImport.currentLib, retry = false);
                    } else {
                        console.log(`The request for ${req.url} returned a code of ${req.status} (${req.statusText}).`);
                        // If the request returned an API response but was not successful, log it in the outcome
                        outcome = {
                            success: false,
                            response: req
                        }
                    }
                }
            } catch(e){
                // If the request yielded an error, log it in the outcome
                outcome = {
                    success : null,
                    error: e
                }
            } finally {
                return outcome;
            }
        },

        async checkImport(reqResults){
            let lib = zoteroRoam.interface.activeImport.currentLib;
            let libIndex = zoteroRoam.data.libraries.findIndex(l => l.path == lib.path);
            let keys = Object.values(reqResults).map(it => it.data.key);
            let counter = 0;
            let updatedData = false;
            while(counter < 2 && !updatedData){
                try{
                    let check = await fetch(`https://api.zotero.org/${lib.path}/items?itemKey=${keys.join(",")}&since=${lib.version}`, {
                        method: 'GET',
                        headers: {
                            'Zotero-API-Version': 3,
                            'Zotero-API-Key': lib.apikey
                        }
                    });
                    if(check.ok){
                        let checkResults = await check.json();
                        if(checkResults.length > 0){
                            updatedData = {...zoteroRoam.handlers.extractCitekeys(checkResults)};
                            zoteroRoam.data.libraries[libIndex].version = check.headers.get('Last-Modified-Version');
                            zoteroRoam.interface.activeImport.libraries = zoteroRoam.utils.getLibraries();
                            zoteroRoam.interface.activeImport.currentLib = zoteroRoam.interface.activeImport.libraries.find(l => l.path == zoteroRoam.interface.activeImport.currentLib.path);
                        } else {
                            zoteroRoam.utils.sleep(2000);
                        }
                    }
                    counter += 1;
                } catch(e){console.log(e)};
            }

            return updatedData || reqResults;
        }
    }
})();