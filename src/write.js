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

        async createItem(data, library = zoteroRoam.data.libraries[0]){
            let canWrite = false;
            let libKeys = zoteroRoam.data.keys.filter(k => zoteroRoam.config.requests.filter(req => req.library == library.prefix).map(req => req.apikey).includes(k.key));
            let apikey = libKeys.find(k => {
                let libType = library.prefix.startsWith("users") ? "users" : "groups";
                switch(libType){
                    case "users":
                        canWrite = k.access.user.write;
                        break;
                    case "groups":
                        let groupID = library.prefix.split("/")[1];
                        if(Object.keys(k.access.groups).includes(groupID)){
                            canWrite = k.access.groups[groupID].write;
                        } else {
                            canWrite = k.access.groups.all.write;
                        }
                        break;
                }
                return canWrite;
            });

            if(apikey){
                let response = false;
                let req = await fetch(`https://api.zotero.org/${library.prefix}/items`, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        'Zotero-API-Version': 3,
                        'Zotero-API-Key': apikey.key,
                        'If-Unmodified-Since-Version': library.version
                    }
                });

                if(req.ok == true){
                    response = await req.json();
                    let libIndex = zoteroRoam.data.libraries.find(lib => lib.prefix == library.prefix);
                    zoteroRoam.data.libraries[libIndex].version = response.headers.get('Last-Modified-Version');
                } else {
                    console.log(`The request for ${req.url} returned a code of ${req.status}`);
                }

                return response;
            } else {
                console.log(`No API key has permission to write in the target library ${library.prefix}`);
                return false;
            }

        }

    }
})();