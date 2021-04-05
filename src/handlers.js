;(()=>{
    zoteroRoam.handlers = {

        async addBlockObject(parent_uid, object) {
            // If the Object doesn't have a string property, throw an error
            if(typeof(object.string) === 'undefined'){
                console.log(object);
                throw new Error('All blocks passed as an Object must have a string property');
            } else {
                // Otherwise add the block
                zoteroRoam.utils.addBlock(uid = parent_uid, blockString = object.string, order = 0);
                // If the Object has a `children` property
                if(typeof(object.children) !== 'undefined'){
                    // Wait until the block above has been added to the page
                    // A recent update provides a function to request a block UID, but let's stick with waiting so that we can make sure not to create orphan blocks
                    let top_uid = await zoteroRoam.handlers.waitForBlockUID(parent_uid, object.string);
                    // Once the UID of the parent block has been obtained, go through each child element 1-by-1
                    // If a child has children itself, the recursion should ensure everything gets added where it should
                    for(let j = object.children.length - 1; j >= 0; j--){
                        if(object.children[j].constructor === Object){
                            await zoteroRoam.handlers.addBlockObject(top_uid, object.children[j]);
                        } else if(object.children[j].constructor === String){
                            zoteroRoam.utils.addBlock(uid = top_uid, blockString = object.children[j], order = 0);
                        } else {
                            throw new Error('All children array items should be of type String or Object');
                        }
                    }
                }
            }
        },

        // refSpan is the DOM element with class "rm-page-ref" that is the target of mouse events -- but it's its parent that has the information about the citekey + the page UID
        async addItemData(refSpan) {
            try {
                let citekey = refSpan.parentElement.dataset.linkTitle.replace("@", ""); // I'll deal with tags later, or not at all
                let pageUID = refSpan.parentElement.dataset.linkUid;
                let item = zoteroRoam.data.items.find(i => { return i.key == citekey });
                if (item) {
                    let itemData = await zoteroRoam.handlers.formatData(item);
                    if (itemData.length > 0) {
                        await zoteroRoam.handlers.addMetadataArray(page_uid = pageUID, arr = itemData);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        },  

        async addMetadataArray(page_uid, arr){
            if(arr.length > 0){
                // Go through the array items in reverse order, because each block gets added to the top so have to start with the 'last' block
                for(k = arr.length - 1; k >= 0; k--){
                    // If the element is an Object, pass it to addBlockObject to recursively process its contents
                    if(arr[k].constructor === Object){
                        await zoteroRoam.handlers.addBlockObject(page_uid, arr[k]);
                    } else if(arr[k].constructor === String) {
                        // If the element is a simple String, add the corresponding block & move on
                        zoteroRoam.utils.addBlock(uid = page_uid, blockString = arr[k], order = 0);
                    } else {
                        // If the element is of any other type, throw an error
                        console.log(arr[k]);
                        throw new Error('All array items should be of type String or Object');
                    }
                };
                return {
                    success: true
                }
            } else {
                console.log("The metadata array was empty ; nothing was done.")
                return {
                    success: false
                }
            }
        },

        async addSearchResult(title, uid){
            let citekey = title.replace("@", "");
            let item = zoteroRoam.data.items.find(function (i) { return i.key == citekey });
            let itemData = await zoteroRoam.handlers.formatData(item);
            let outcome = {};
        
            if(item && itemData.length > 0){
                let pageUID = uid || "";
                if(uid) {
                    outcome = await zoteroRoam.handlers.addMetadataArray(page_uid = uid, arr = itemData);
                } else {
                    window.roamAlphaAPI.createPage({'page': {'title': title}});
                    let pageUID = await zoteroRoam.handlers.waitForPageUID(title);
                    if(pageUID != null){
                        outcome = await zoteroRoam.handlers.addMetadataArray(page_uid = pageUID, arr = itemData);
                        try {
                            let inGraphDiv = document.querySelector(".item-in-graph");
                            if(inGraphDiv != null){
                                inGraphDiv.innerHTML = `<span class="bp3-icon-tick bp3-icon bp3-intent-success"></span><span> In the graph</span>`;
                            }
                            let goToPageButton = document.querySelector(".item-go-to-page");
                            if(goToPageButton != null){
                                goToPageButton.setAttribute("data-uid", pageUID);
                                goToPageButton.disabled = false;
                            }
                        } catch(e){};
                        await zoteroRoam.utils.sleep(125);
                    } else {
                        console.log(pageUID);
                        alert("There was a problem in obtaining the page's UID.");
                    }
                }
                if(outcome.success){
                    alert(`Metadata was successfully added. You can check the page's contents to verify if you'd like.`);
                } else {
                    alert("The metadata array couldn't be properly processed.")
                }
            } else {
                console.log(item);
                console.log(itemData);
                alert("Something went wrong when formatting or importing the item's data.");
            }
        },

        extractCitekeys(arr){
            return arr.map(item => {
                if(typeof(item.data.extra) !== 'undefined'){
                    if(item.data.extra.includes('Citation Key: ')){
                        item.key = item.data.extra.match('Citation Key: (.+)')[1];
                    }
                }
                return item;
            });
        },

        // TODO: Add handling of non-200 response codes from the API
        async fetchData(apiKey, dataURI, params){
            let requestURL = `https://api.zotero.org/${dataURI}?${params}`;
            let results = [];
            // Make initial call to API, to know total number of results
            try{
                let response = await fetch(requestURL, {
                    method: 'GET',
                    headers: {
                        'Zotero-API-Version': 3,
                        'Zotero-API-Key': apiKey
                    }
                });
                if(response.ok == true){
                    let totalResults = response.headers.get('Total-Results');
                    let paramsQuery = new URLSearchParams(params);
                    let startIndex = (paramsQuery.has('start')) ? (Number(paramsQuery.get('start'))) : 0;
                    let limitParam = (paramsQuery.has('limit')) ? (Number(paramsQuery.get('limit'))) : 100;

                    results = await response.json();

                    let traversed = startIndex + results.length;
                    if(traversed < totalResults){
                        let extraCalls = Math.ceil((totalResults - traversed)/limitParam);
                        let apiCalls = [];
                        for(i=1; i <= extraCalls; i++){
                            let batchStart = traversed + limitParam*(i - 1);
                            paramsQuery.set('start', batchStart);
                            paramsQuery.set('limit', limitParam);
                            apiCalls.push(fetch(`https://api.zotero.org/${dataURI}?${paramsQuery.toString()}`, {
                                method: 'GET',
                                headers: {
                                    'Zotero-API-Version': 3,
                                    'Zotero-API-Key': apiKey
                                }
                            }));
                        }
                        let additionalResults = await Promise.all(apiCalls);
                        // TODO: Check here that all responses were ok, if there were errors then either re-run the requests or log the issues
                        // Presumably the problems will be server issues (rate-limiting, or server error)
                        // If it's rate-limiting then that probably should be handled separately, but if it's a server error just retrying should do it
                        // This will be a generally useful feature, so a separate function should be written to check the output of API responses before continuing
                        // Then that function should be applied to every single instance of API request
                        let processedResults = await Promise.all(additionalResults.map(data => { return data.json(); }));
                        processedResults = processedResults.flat(1);
                        results.push(...processedResults);
                    }
                } else {
                    console.log(`The request for ${response.url} returned a code of ${response.status}`);
                }
            } catch(e) {
                console.error(e);
                alert("The extension encountered at least one error during the data request process. Please check the console for details on the problem.");
            } finally {
                return{
                    data: results
                }
            }
        },

        async formatData(item) {
            let itemData = [];
            let type = item.data.itemType;
            let funcName = zoteroRoam.funcmap.DEFAULT;

            if(zoteroRoam.config.userSettings.funcmap){
                funcName = zoteroRoam.config.userSettings.funcmap[`${type}`] || zoteroRoam.config.userSettings.funcmap['DEFAULT'] || funcName;
            }
            try {
                itemData = await zoteroRoam.utils.executeFunctionByName(funcName, window, item);
                return itemData;
            } catch(e) {
                console.error(e);
                console.log(`There was a problem when formatting the item with function ${funcName}`);
                return [];
            }
        },

        setupUserRequests(){
            if(!zoteroRoam.config.userSettings.dataRequests){
                throw new Error('At least one data request object needs to be specified in order to use the extension. Read through the docs for basic setup examples.');
            } else {
                let requests = zoteroRoam.config.userSettings.dataRequests;
                requests = (requests.constructor === Array) ? requests : [requests];
                let fallbackAPIKey = requests.find(rq => rq.apikey !== undefined)['apikey'];
                let fallbackParams = requests.find(rq => rq.params !== undefined)['params'];
                requests = requests.map( (rq, i) => {
                    let {name = `${i}`, apikey = fallbackAPIKey, dataURI, params = fallbackParams} = rq; 
                    return {
                        apikey: apikey,
                        dataURI: dataURI,
                        params: params,
                        name: name
                    }; 
                });
                zoteroRoam.config.requests = requests;
            }
        },

        async requestData(requests) {
            if(requests.length == 0){
                throw new Error("No data requests were added to the config object - check for upstream problems");
            }
            try{
                let dataCalls = [];
                let collectionsCalls = [];
                requests.forEach( rq => {
                    let userOrGroupPrefix = rq.dataURI.match(/(users|groups)\/(.+?)\//g)[0].slice(0,-1);
                    dataCalls.push(zoteroRoam.handlers.fetchData(apiKey = rq.apikey, dataURI = rq.dataURI, params = rq.params));
                    collectionsCalls.push(fetch(`https://api.zotero.org/${userOrGroupPrefix}/collections`, {
                        method: 'GET',
                        headers: {
                            'Zotero-API-Version': 3,
                            'Zotero-API-Key': rq.apikey
                        }
                    }));
                });
                // Items data
                let requestsResults = await Promise.all(dataCalls);
                requestsResults = requestsResults.map( (res, i) => res.data.map(item => { item.requestLabel = requests[i].name; item.requestIndex = i; return item })).flat(1);
                requestsResults = zoteroRoam.handlers.extractCitekeys(requestsResults);
                // Collections data
                let collectionsResults = await Promise.all(collectionsCalls);
                collectionsResults = await Promise.all(collectionsResults.map(cl => cl.json()));
                collectionsResults = collectionsResults.flat(1);
                
                return {
                    success: true,
                    data: {
                        items: requestsResults,
                        collections: collectionsResults
                    }
                }
            } catch(e) {
                console.error(e);
                return {
                    success: false
                }
            }
        },

        async requestItemBib(item, {include = "bib", style, linkwrap, locale} = {}){
            let userOrGroup = (item.library.type == "user") ? "users" : "groups";
            let rq_apikey = zoteroRoam.config.requests[`${item.requestIndex}`].apikey;
            let bibRequest = await fetch(`https://api.zotero.org/${userOrGroup}/${item.library.id}/items/${item.data.key}?include=${include}&style=${style}&linkwrap=${linkwrap}&locale=${locale}`, {
                method: 'GET',
                headers: {
                    'Zotero-API-Version': 3,
                    'Zotero-API-Key': rq_apikey
                }
            });

            let bibOutput = await bibRequest.json();
            let bibHTML = bibOutput[`${include}`];

            return bibHTML;
        },

        async requestItemChildren(item){
            let rq_apikey = zoteroRoam.config.requests[`${item.requestIndex}`].apikey;
            let childrenRequest = await fetch(`${item.links.self.href}/children`,{
                method: 'GET',
                headers: {
                    'Zotero-API-Version': 3,
                    'Zotero-API-Key': rq_apikey
            }});
            let childrenOutput = await childrenRequest.json();
            
            return childrenOutput;
        },

        simplifyDataArray(arr){
            // Filter out attachments & notes
            let itemsArray = arr.filter(el => !(["attachment", "note", "annotation"].includes(el.data.itemType)));
            // Simplify data structure
            itemsArray = itemsArray.map(item => {
                let simplifiedItem = {
                    key: item.key,
                    title: `${item.data.title || ""}`,
                    abstract: `${item.data.abstractNote || ""}`,
                    authors: `${item.meta.creatorSummary || ""}`,
                    year: `${(item.meta.parsedDate) ? (new Date(item.meta.parsedDate)).getUTCFullYear().toString() : ""}`,
                    meta: "",
                    tags: item.data.tags.map(t => t.tag),
                    authorsFull: item.data.creators.map(c => {return (c.name) ? c.name : [c.firstName, c.lastName].filter(Boolean).join(" ")}),
                    authorsRoles: item.data.creators.map(c => c.creatorType),
                    authorsLastNames: item.data.creators.map(c => c.lastName),
                    tagsString: item.data.tags.map(i => `#${i.tag}`).join(", ")
                }
                // Build metadata string
                let pubInfo = [item.data.publicationTitle, item.data.university, item.data.bookTitle].filter(Boolean);
                if(pubInfo.length > 0){
                    simplifiedItem.meta += `, ${pubInfo[0]}`;
                }
                if(item.data.publisher){
                    simplifiedItem.meta += `, ${item.data.publisher}`;
                    if(item.data.place){
                        simplifiedItem.meta += `: ${item.data.place}`;
                    }
                };
                if(item.data.volume){
                    simplifiedItem.meta += `, ${item.data.volume}`;
                    if(item.data.issue){
                        simplifiedItem.meta += `(${item.data.issue})`;
                    }
                }
                simplifiedItem.meta = (item.data.pages) ? (simplifiedItem.meta + `, ${item.data.pages}.`) : ".";
        
                return simplifiedItem;
        
            });
        
            return itemsArray;
        },
        
        getLibItems(format = "citekey", display = "citekey"){
            return zoteroRoam.data.items.filter(item => !['attachment', 'note', 'annotation'].includes(item.data.itemType)).map(item => {
                return {key: item.key, 
                        value: zoteroRoam.utils.formatItemReference(item, format) || item.key,
                        display: zoteroRoam.utils.formatItemReference(item, display)};
            });
        },

        async waitForBlockUID(parent_uid, string) {
            let top_block = null;
            let found = false;
            let tries = 0;
            // As long as the top-block hasn't been matched in content, keep checking it
            try {
                do {
                    top_block = zoteroRoam.utils.getTopBlockData(parent_uid);
                    if (typeof (top_block.text) !== 'undefined' && top_block.text == string) {
                        found = true;
                        return top_block.uid;
                    } else {
                        // Keep track of attempts to avoid infinite search, and wait a bit before continuing
                        tries = tries + 1;
                        await zoteroRoam.utils.sleep(75);
                    }
                } while (tries < 50 && !found);
                // If after 50 attempts there still isn't a match, throw an error
                console.log(top_block);
                throw new Error('The top block couldn\'t be matched');
            } catch (e) {
                console.error(e);
            }
        },

        async waitForPageUID(title) {
            let found = false;
            let tries = 0;
            do {
                let pageInfo = zoteroRoam.utils.lookForPage(title);
                if(pageInfo.present == true){
                    found = true;
                    return pageInfo.uid;
                } else {
                    tries += 1;
                    await zoteroRoam.utils.sleep(75);
                }
            } while (tries < 50 && !found);
            // If after 50 attempts there still isn't a match, throw an error
            throw new Error(`The page with title "${title}" couldn\'t be found`);
        }
    };
})();
