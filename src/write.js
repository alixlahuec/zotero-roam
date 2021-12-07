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

        async postItemData(library, itemList){
            let outcome = {};
            try {
              let req = await fetch(`https://api.zotero.org/${library.path}/items`, {
                method: 'POST',
                body: JSON.stringify(itemList),
                headers: {
                  'Zotero-API-Version': 3, 
                  'Zotero-API-Key': library.apikey
                },
              });
              if(req.ok == true){
                let response = await req.json();
                outcome = {
                  success: true,
                  data: response
                }
              } else {
                outcome = {
                  success: false,
                  response: req
                }
              }
              
            } catch(e){
              outcome = {
                success: null,
                error: e
              }
            } finally {
              return outcome;
            }
        },

        async editTags(tags, library, into){
            let tagList = tags.filter(t => t.tag != into || (t.tag == into && t.meta.type == 1));
            let itemList = [];
          
            let libItems = zoteroRoam.data.items.filter(i => i.library.type + 's/' + i.library.id == library.path);
            libItems.forEach(i => {
              let itemTags = i.data.tags;
              let matched = false;
              
              for(let elem of tagList){
                let has_tag = itemTags.find(t => t.tag == elem.tag && t.meta.type == elem.meta.type);
                if(has_tag){
                  itemTags[has_tag] = {tag: into, type: 0};
                  matched = true;
                }
              }
          
              if(matched){
                itemList.push({
                  key: i.data.key,
                  tags: itemTags
                })
              }
            });
          
            return await zoteroRoam.write.postItemData(library, itemList);
        },

        // TODO: Rewrite to support tag types
        async editItemTags(item, {add = [], remove = []} = {}){
            let currentTags = item.data.tags.map(t => t.tag);
            let newTags = currentTags.filter(t => !remove.includes(t)).push(...add).map(t => { return {tag: t} });

            let patchReq = await zoteroRoam.write.patchItemData(item, {tags: newTags});

            return patchReq;
        },

        // TODO: Rewrite to support tag types
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
                    // If the request returned a successful API response, update the data store
                    await zoteroRoam.extension.update(popup = false, reqs = zoteroRoam.config.requests.filter(rq => rq.library == library.path));
                    // Then update current library information
                    zoteroRoam.activeImport.libraries = zoteroRoam.utils.getLibraries();
                    zoteroRoam.activeImport.currentLib = zoteroRoam.activeImport.libraries.find(lib => lib.path == zoteroRoam.activeImport.currentLib.path);
                    
                    let reqResults = await req.json();
                    outcome = {
                        success: true,
                        data: reqResults
                    }

                } else {
                    if(req.status == 412 && retry == true){
                        // If the API response is a 412 error (Precondition Failed), update the data store
                        await zoteroRoam.extension.update(popup = false, reqs = zoteroRoam.config.requests.filter(rq => rq.library == library.path));
                        // Then update current library information
                        zoteroRoam.activeImport.libraries = zoteroRoam.utils.getLibraries();
                        zoteroRoam.activeImport.currentLib = zoteroRoam.activeImport.libraries.find(lib => lib.path == zoteroRoam.activeImport.currentLib.path);
                        // Then try again (only once)
                        outcome = await zoteroRoam.write.importItems(data, library = zoteroRoam.activeImport.currentLib, retry = false);
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
            let lib = zoteroRoam.activeImport.currentLib;
            let keys = Object.values(reqResults).map(it => it.data.key);
            let version = Object.values(reqResults)[0].version;
            let checkVersion = version;

            let updatedData = false;
                try{
                    let check = await fetch(`https://api.zotero.org/${lib.path}/items?itemKey=${keys.join(",")}&since=${version}`, {
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
                            checkVersion = check.headers.get('Last-Modified-Version');
                        }
                    }
                } catch(e){console.log(e)};
            

            return {
                updated: checkVersion > version,
                data: updatedData || reqResults
            };
        }
    }
})();