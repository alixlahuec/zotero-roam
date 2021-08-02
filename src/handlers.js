;(()=>{
    zoteroRoam.handlers = {

        addBlockObject(parent_uid, object) {
            let {string: blockString, children: blockChildren, ...opts} = object;
            // If the Object doesn't have a string property, throw an error
            if(typeof(blockString) === 'undefined'){
                console.log(object);
                throw new Error('All blocks passed as an Object must have a string property');
            } else {
                // Otherwise add the block
                let blockUID = zoteroRoam.utils.addBlock(uid = parent_uid, blockString = blockString, order = 0, opts);
                // If the Object has a `children` property
                if(typeof(blockChildren) !== 'undefined'){
                    // Go through each child element 1-by-1
                    // If a child has children itself, the recursion should ensure everything gets added where it should
                    for(let j = blockChildren.length - 1; j >= 0; j--){
                        if(blockChildren[j].constructor === Object){
                            zoteroRoam.handlers.addBlockObject(blockUID, blockChildren[j]);
                        } else if(blockChildren[j].constructor === String){
                            zoteroRoam.utils.addBlock(uid = blockUID, blockString = blockChildren[j], order = 0);
                        } else {
                            throw new Error('All children array items should be of type String or Object');
                        }
                    }
                }
            }
        },

        addMetadataArray(page_uid, arr){
            if(arr.length > 0){
                // Go through the array items in reverse order, because each block gets added to the top so have to start with the 'last' block
                for(k = arr.length - 1; k >= 0; k--){
                    // If the element is an Object, pass it to addBlockObject to recursively process its contents
                    if(arr[k].constructor === Object){
                        zoteroRoam.handlers.addBlockObject(page_uid, arr[k]);
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
                console.log("The metadata array was empty ; nothing was done.");
                return {
                    success: false
                }
            }
        },

        async importItemMetadata(title, uid, {popup = true} = {}){
            let citekey = title.replace("@", "");
            let item = zoteroRoam.data.items.find(i => i.key == citekey);
            let itemData = await zoteroRoam.handlers.formatData(item);
            let outcome = {};
            let pageUID = uid || "";

            if(item && itemData.length > 0){
                if(uid) {
                    outcome = zoteroRoam.handlers.addMetadataArray(page_uid = uid, arr = itemData);
                } else {
                    pageUID = window.roamAlphaAPI.util.generateUID();
                    window.roamAlphaAPI.createPage({'page': {'title': title, 'uid': pageUID}});
                    outcome = zoteroRoam.handlers.addMetadataArray(page_uid = pageUID, arr = itemData);
                }
                let msg = outcome.success ? `Metadata was successfully added.` : "The metadata array couldn't be properly processed.";
                let intent = outcome.success ? "success" : "danger";
                if(popup == true){
                    zoteroRoam.interface.popToast(message = msg, intent = intent);
                } else {
                    console.log(msg);
                }
            } else {
                console.log(item);
                console.log(itemData);
                zoteroRoam.interface.popToast(message = "Something went wrong when formatting or importing the item's data.", intent = "danger");
            }
            zoteroRoam.events.emit('metadata-added', {
                success: outcome.success,
                uid: pageUID,
                title: title,
                item: item,
                meta: itemData
            });
        },

        addItemNotes(title, uid, {popup = true} = {}){
            let citekey = title.startsWith("@") ? title.slice(1) : title;
            let item = zoteroRoam.data.items.find(i => i.key == citekey);

            try {
                let itemNotes = zoteroRoam.formatting.getItemChildren(item, {pdf_as: "raw", notes_as: "formatted", split_char = zoteroRoam.config.params.notes["split_char"] }).notes;
                let outcome = {};

                let pageUID = uid || "";
                if(uid){
                    outcome = zoteroRoam.handlers.addMetadataArray(page_uid = uid, arr = [{string: "[[Notes]]", children: itemNotes}]);
                } else {
                    pageUID = window.roamAlphaAPI.util.generateUID();
                    window.roamAlphaAPI.createPage({'page': {'title': title, 'uid': pageUID}});
                    outcome = zoteroRoam.handlers.addMetadataArray(page_uid = pageUID, arr = [{string: "[[Notes]]", children: itemNotes}]);
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
                }

                let outcomeMsg = outcome.success ? "Notes successfully imported." : "The notes couldn't be imported.";
                let outcomeIntent = outcome.success ? "success" : "danger";
                if(popup == true){
                    zoteroRoam.interface.popToast(outcomeMsg, outcomeIntent);
                } else {
                    console.log(outcomeMsg);
                }
                zoteroRoam.events.emit('notes-added', {
                    success: outcome.success,
                    uid: pageUID,
                    title: title,
                    item: item,
                    notes: itemNotes
                });

            } catch(e){
                console.error(e);
                console.log(item);
                console.log(itemChildren);
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

        /**
         * @todo Add handling of non-200 response codes from the API
         * Fetches data from the Zotero Web API
         * @param {string} apiKey - The API key for the request 
         * @param {string} dataURI - The dataURI for the request
         * @param {string} params - The params for the request
         * @returns {Object} The data received from the API, if successful
         */
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
                zoteroRoam.interface.popToast("The extension encountered an error while requesting Zotero data. Please check the console for details.", "danger");
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

        formatNotes(notes, use = zoteroRoam.config.params.notes.use, split_char = zoteroRoam.config.params.notes["split_char"]){
            let notesData = [];
            let funcName = zoteroRoam.config.params.notes.func;

            try{
                switch(use){
                    case "raw":
                        notesData = zoteroRoam.utils.executeFunctionByName(funcName, window, notes);
                        return notesData;
                    case "text":
                        let notesText = zoteroRoam.utils.splitNotes(notes, split_char = split_char);
                        notesData = zoteroRoam.utils.executeFunctionByName(funcName, window, notesText);
                        return notesData;
                    default:
                        console.error(`Unsupported format : ${use}`);
                }
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
                        name: name,
                        library: dataURI.match(/(users|groups)\/(.+?)\//g)[0].slice(0,-1)
                    }; 
                });
                let libList = Array.from(new Set(requests.map(rq => rq.library)));
                zoteroRoam.data.libraries = libList.map(lib => { return {path: lib, version: 0, apikey: requests.find(rq => rq.library == lib).apikey} });
                zoteroRoam.config.requests = requests;
            }
        },

        /** No longer in use */
        async checkForScitations(refSpan){
            try {
                let citekey = refSpan.parentElement.dataset.linkTitle.replace("@", ""); // I'll deal with tags later, or not at all
                let item = zoteroRoam.data.items.find(i => i.key == citekey);
                if(item) {
                    if(item.data.DOI){
                        let scitations = await zoteroRoam.handlers.requestScitations(item.data.DOI);
                        if(scitations.simplified.length == 0){
                            zoteroRoam.interface.popToast("This item has no available citing papers");
                        } else {
                            zoteroRoam.interface.popCitationsOverlay(item.data.DOI, citekey);
                        }
                    } else{
                        zoteroRoam.interface.popToast("This item has no DOI (required for citations lookup).", "danger");
                    }
                }
            } catch (e) {
                console.error(e);
            }
        },

        async checkForSemantic_citations(refSpan){
            try {
                let citekey = refSpan.parentElement.dataset.linkTitle.replace('@', ""); // I'll deal with tags later, or not at all
                let item = zoteroRoam.data.items.find(i => i.key == citekey);
                if(item){
                    if(item.data.DOI){
                        let doi = zoteroRoam.utils.parseDOI(item.data.DOI);
                        let semantic = await zoteroRoam.handlers.getSemantic(doi);
                        if(semantic.citations){
                            if(semantic.citations.length == 0){
                                zoteroRoam.interface.popToast("This item has no available citing papers");
                            } else {
                                zoteroRoam.interface.popCitationsOverlay(doi, citekey, type = "citations");
                            }
                        } else {
                            zoteroRoam.interface.popToast("No data could be retrieved.", "danger");
                        }
                    } else {
                        zoteroRoam.interface.popToast("This item has no DOI (required for citations lookup).", "danger");
                    }
                }
            } catch(e){
                console.error(e);
            }
        },

        async checkForSemantic_references(refSpan){
            try {
                let citekey = refSpan.parentElement.dataset.linkTitle.replace('@', ""); // I'll deal with tags later, or not at all
                let item = zoteroRoam.data.items.find(i => i.key == citekey);
                if(item){
                    if(item.data.DOI){
                        let doi = zoteroRoam.utils.parseDOI(item.data.DOI);
                        let semantic = await zoteroRoam.handlers.getSemantic(doi);
                        if(semantic.references){
                            if(semantic.references.length == 0){
                                zoteroRoam.interface.popToast("This item has no available references");
                            } else {
                                zoteroRoam.interface.popCitationsOverlay(doi, citekey, type = "references");
                            }
                        } else {
                            zoteroRoam.interface.popToast("No data could be retrieved.", "danger");
                        }
                    } else {
                        zoteroRoam.interface.popToast("This item has no DOI (required for references lookup).", "danger");
                    }
                }
            } catch(e){
                console.error(e);
            }
        },

        async importSelectedItems(){

            let outcome = {};

            // Retrieve import parameters
            let lib = zoteroRoam.citations.activeImport.currentLib;
            let colls = Array.from(zoteroRoam.interface.citations.overlay.querySelectorAll(`.options-collections-list [name="collections"]`)).filter(op => op.checked).map(op => op.value);
            let identifiers = zoteroRoam.citations.activeImport.items;
            let tags = zoteroRoam.interface.citations.overlay.querySelector(".options-tags_selection").dataset.tags;
            tags = JSON.parse(tags);

            // Request metadata for each item
            let harvestCalls = [];
            identifiers.forEach(id => {
                harvestCalls.push(zoteroRoam.handlers.requestCitoid(query = id, {collections: colls, tag_with: tags}));
            });
            outcome.harvest = await Promise.all(harvestCalls);

            // Write obtained metadata to Zotero
            let toWrite = {identifiers: [], data: []};
            outcome.harvest.forEach(res => {
                if(res.success == true){
                    toWrite.identifiers.push(res.query);
                    toWrite.data.push(res.data);
                }
            });
            outcome.write = await zoteroRoam.write.importItems(toWrite.data, lib);
            outcome.write.identifiers = toWrite.identifiers;

            // Return outcome of the import process
            zoteroRoam.events.emit('write', {
                collections: colls,
                identifiers: identifiers,
                library: lib,
                tags: tags,
                outcome: outcome,
                context: {
                    citing: {
                        doi: zoteroRoam.citations.currentDOI,
                        key: zoteroRoam.citations.currentCitekey,
                        type: zoteroRoam.citations.currentType
                    }
                }
            })
            console.log(outcome);
            return outcome;

        },

        async requestCitoid(query, { format = "zotero", has_relation = false, tag_with = [], collections = []} = {}){
            let outcome = {};

            try{
                let req = await fetch(`https://en.wikipedia.org/api/rest_v1/data/citation/${format}/${encodeURIComponent(query)}`, { method: 'GET' });
                if(req.ok == true){
                    let reqResults = await req.json();
                    // Remove key and version from the data object
                    var {key, version, ...item} = reqResults[0];
                    // Set collections, tags, relations (if any)
                    item.collections = collections;
                    item.tags = tag_with.map(t => { return {tag: t} });
                    item.relations = {};
                    if(has_relation != false){
                        item.relations["dc_relation"] = `http://zotero.org/${zoteroRoam.utils.getItemPrefix(has_relation)}/items/${has_relation.data.key}`;
                    }
                    // If the request returned a successful API response, log the data
                    outcome = {
                        query: query,
                        success: true,
                        data: item
                    }
                } else {
                    // If the request returned an API response but was not successful, log it in the outcome
                    console.log(`The request for ${req.url} returned a code of ${req.status}`)
                    outcome = {
                        query: query,
                        success: false,
                        response: req
                    }
                }
            } catch(e){
                // If the request yielded an error, log it in the outcome
                outcome = {
                    query: query,
                    success : null,
                    error: e
                }
            } finally {
                return outcome;
            }
        },

        /** No longer in use */
        async requestScitations(doi){
            let sciteListIndex = zoteroRoam.data.scite.findIndex(res => res.doi == doi);
            if(sciteListIndex == -1){
                let scitations = await fetch(`https://api.scite.ai/papers/sources/${doi}`);
                let scitingPapers = await scitations.json();
                let citeList = Object.values(scitingPapers.papers);
                let citeObject = {
                    doi: doi,
                    citations: citeList || []
                };
                citeObject.citations.forEach((cit, index) => {
                    let libDOIs = zoteroRoam.data.items.filter(it => it.data.DOI).map(it => zoteroRoam.utils.parseDOI(it.data.DOI));
                    if(libDOIs.includes(cit.doi)){
                        citeObject.citations[index].inLibrary = true;
                    }            
                });
                citeObject.simplified = zoteroRoam.handlers.simplifyCitationsObject(citeObject.citations);
                citeObject.keywords = zoteroRoam.handlers.getCitationsKeywordsCounts(citeObject.citations);

                zoteroRoam.data.scite.push(citeObject);
                return citeObject;
            } else{
                return zoteroRoam.data.scite[sciteListIndex];
            }
        },

        async getSemantic(doi){
            let dataIndex = zoteroRoam.data.semantic.findIndex(res => res.doi == doi);
            if(dataIndex == -1){
                let outcome = await zoteroRoam.handlers.requestSemantic(doi);
                if(outcome.success == true){
                    let libDOIs = zoteroRoam.data.items.filter(it => it.data.DOI).map(it => zoteroRoam.utils.parseDOI(it.data.DOI));
                    outcome.data.citations.forEach((cit, index) => {
                        if(cit.doi && zoteroRoam.utils.includes_anycase(libDOIs, cit.doi)){
                            outcome.data.citations[index].inLibrary = true;
                        }
                    });
                    outcome.data.references.forEach((ref, index) => {
                        if(ref.doi && zoteroRoam.utils.includes_anycase(libDOIs, ref.doi)){
                            outcome.data.references[index].inLibrary = true;
                        }
                    })
                    zoteroRoam.data.semantic.push(outcome.data);
                    return outcome.data;
                } else {
                    console.log(outcome);
                    return {};
                }
            } else {
                return zoteroRoam.data.semantic[dataIndex];
            }
        },

        async requestSemantic(doi){
            let outcome = {};

            try{
                let req = await fetch(`https://api.semanticscholar.org/v1/paper/${doi}?include_unknown_references=true`, {method: 'GET'});
                if(req.ok == true){
                    let reqResults = await req.json();
                    // Extract citations and references from the data object
                    var {citations, references} = reqResults;
                    let citeObject = {
                        doi: doi,
                        data: reqResults,
                        citations: citations || [],
                        references: references || []
                    };
                    // Parse metadata for both citations and references
                    citeObject.citations = citeObject.citations.filter(cit => cit.doi || cit.url).map(cit => zoteroRoam.utils.parseSemanticItem(cit));
                    citeObject.references = citeObject.references.filter(ref => ref.doi || ref.url).map(ref => zoteroRoam.utils.parseSemanticItem(ref));

                    // If the request returned a successful API response, log the data
                    outcome = {
                        success: true,
                        data: citeObject
                    }
                    
                } else {
                    // If the request returned an API response but was not successful, log it in the outcome
                    console.log(`The request for ${req.url} returned a code of ${req.status}`)
                    outcome = {
                        doi: doi,
                        success: false,
                        response: req
                    }
                }
            } catch(e){
                // If the request yielded an error, log it in the outcome
                outcome = {
                    doi: doi,
                    success: null,
                    error: e
                }
            } finally {
                return outcome;
            }

        },

        async requestData(requests, update = false, collections = true) {
            let dataCalls = [];
            let collectionsCalls = [];
            let collectionsResults = [];
            let deletedCalls = [];
            let deletedResults = [];
            if(requests.length == 0){
                throw new Error("No data requests were added to the config object - check for upstream problems");
            }
            try{
                // Items data
                requests.forEach( rq => {
                    dataCalls.push(zoteroRoam.handlers.fetchData(apiKey = rq.apikey, dataURI = rq.dataURI, params = rq.params));
                });
                let requestsResults = await Promise.all(dataCalls);
                requestsResults = requestsResults.map( (res, i) => res.data.map(item => { 
                        item.requestLabel = requests[i].name; 
                        item.requestIndex = i; 
                        return item;
                })).flat(1);
                requestsResults = zoteroRoam.handlers.extractCitekeys(requestsResults);

                let currentLibs = zoteroRoam.data.libraries;
                // Collections data
                if(collections == true){
                    currentLibs.forEach(lib => {
                        collectionsCalls.push(fetch(`https://api.zotero.org/${lib.path}/collections?since=${lib.version}`, {
                            method: 'GET',
                            headers: {
                                'Zotero-API-Version': 3,
                                'Zotero-API-Key': lib.apikey
                            }
                        }));
                    });
                    collectionsResults = await Promise.all(collectionsCalls);
                    collectionsResults = await Promise.all(collectionsResults.map( (cl, i) => {
                        // Update stored data on libraries
                        let latestVersion = cl.headers.get('Last-Modified-Version');
                        zoteroRoam.data.libraries[i].version = latestVersion;
                        return cl.json();
                    }));
                    collectionsResults = collectionsResults.flat(1);
                }
                // Deleted data
                if(update == true){
                    currentLibs.forEach(lib => {
                        deletedCalls.push(fetch(`https://api.zotero.org/${lib.path}/deleted?since=${lib.version}`, {
                            method: 'GET',
                            headers: {
                                'Zotero-API-Version': 3,
                                'Zotero-API-Key': lib.apikey
                            }
                        }));
                    });
                    deletedResults = await Promise.all(deletedCalls);
                    deletedResults = await Promise.all(deletedResults.map(res => res.json()));
                    deletedResults = deletedResults.map((res, i) => {
                        return {
                            path: zoteroRoam.data.libraries[i].path,
                            items: res.items,
                            collections: res.collections
                        }
                    });
                    // Remove deleted items & collections from extension dataset
                    zoteroRoam.data.items = zoteroRoam.data.items.filter(it => !deletedResults.find(res => res.path == zoteroRoam.utils.getItemPrefix(it)).items.includes(it.data.key));
                    zoteroRoam.data.collections = zoteroRoam.data.collections.filter(cl => !deletedResults.find(res => res.path == zoteroRoam.utils.getItemPrefix(cl)).collections.includes(cl.key));
                }
                
                return {
                    success: true,
                    data: {
                        items: requestsResults,
                        collections: collectionsResults,
                        deleted: deletedResults
                    }
                }
            } catch(e) {
                console.error(e);
                console.log({
                    dataCalls: dataCalls,
                    collectionsCalls: collectionsCalls,
                    deletedCalls : deletedCalls
                })
                return {
                    success: false,
                    data: null
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
                    itemKey: item.data.key,
                    title: `${item.data.title || ""}`,
                    abstract: `${item.data.abstractNote || ""}`,
                    authors: `${item.meta.creatorSummary || ""}`,
                    year: `${(item.meta.parsedDate) ? (new Date(item.meta.parsedDate)).getUTCFullYear().toString() : ""}`,
                    meta: `${zoteroRoam.utils.makeMetaString(item)}`,
                    tags: item.data.tags.map(t => t.tag),
                    authorsFull: item.data.creators.map(c => {return (c.name) ? c.name : [c.firstName, c.lastName].filter(Boolean).join(" ")}),
                    authorsRoles: item.data.creators.map(c => c.creatorType),
                    authorsLastNames: item.data.creators.map(c => c.lastName || c.name),
                    authorsString: item.data.creators.map(c => c.lastName || c.name).join(" "),
                    tagsString: item.data.tags.map(i => `#${i.tag}`).join(", "),
                    location: zoteroRoam.utils.getItemPrefix(item)
                }

                simplifiedItem["_multiField"] = simplifiedItem.authorsString + " " + simplifiedItem.year + " " + simplifiedItem.title + " " + simplifiedItem.tagsString;
        
                return simplifiedItem;
        
            });
        
            return itemsArray;
        },

        simplifyCitationsObject(citations){
            if(citations.length > 0){
                return citations.map(cit => {
                    let simplifiedCitation = {
                        abstract: cit.abstract || "",
                        doi: cit.doi || "",
                        keywords: cit.keywords || [],
                        keywordsString: cit.keywords ? cit.keywords.join(" ") : "",
                        links: {
                            scite: `https://scite.ai/reports/${cit.slug}`
                        },
                        title: cit.title,
                        year: `${cit.year}` || "",
                        meta: ""
                    };
                    let authors = cit.authors.length > 0 ? cit.authors.map(auth => auth.family) : [];
                    simplifiedCitation.authorsLastNames = cit.authors.length > 0 ? cit.authors.map(auth => auth.family) : [];
                    simplifiedCitation.authorsString = simplifiedCitation.authorsLastNames.join(" ");
                    if(authors.length > 0){
                        if(authors.length > 2){
                            authors = authors.slice(0, 1).join(", ") + " et al.";
                        } else{
                            authors = authors.map((auth, i) => {
                                if(i == 0){
                                    return auth;
                                } else if(i < authors.length - 1){
                                    return `, ${auth}`;                        
                                } else {
                                    return ` and ${auth}`;
                                }
                            }).join("");
                        }
                    } else {
                        authors = "";
                    }
                    simplifiedCitation.authors = authors;
                    // Create metadata string
                    simplifiedCitation.meta = `${cit.journal || cit.publisher}${cit.volume ? ", " + cit.volume + "(" + cit.issue + ")" : ""}${cit.page ? ", " + cit.page + "." : "."}`;
                    // Mark items that are in library
                    if(cit.inLibrary){
                        simplifiedCitation.inLibrary = true;
                    }
                    // Create links :
                    // Connected Papers
                    simplifiedCitation.links.connectedPapers = `https://www.connectedpapers.com/${(!cit.doi) ? "search?q=" + encodeURIComponent(cit.title) : "api/redirect/doi/" + cit.doi}`;
                    // Semantic Scholar
                    if(cit.doi){
                        simplifiedCitation.links.semanticScholar = `https://api.semanticscholar.org/${cit.doi}`;
                    }
                    // Google Scholar
                    simplifiedCitation.links.googleScholar = `https://scholar.google.com/scholar?q=${(!cit.doi) ? encodeURIComponent(cit.title) : cit.doi}`;
        
                    return simplifiedCitation;
                })
            } else {
                return [];
            }
        },

        getCitationsKeywordsCounts(citations){
            if(citations.length > 0){
                let keywords = citations.map(cit => cit.keywords ? cit.keywords.map(w => w.toLowerCase()) : []).flat(1);
                let counts = [];
                for(var i = 0; i < keywords.length; i++){
                    let word = keywords[i];
                    counts.push({keyword: word, count: keywords.filter(w => w == word).length});
                    keywords = keywords.filter(w => w != word);
                }
                return counts.sort((a,b) => a.count < b.count ? 1 : -1);
            } else{
                return [];
            }
        },
        
        getLibItems(format = "citekey", display = "citekey"){
            return zoteroRoam.data.items.filter(item => !['attachment', 'note', 'annotation'].includes(item.data.itemType)).map(item => {
                return {key: item.key,
                        source: "zotero",
                        value: zoteroRoam.utils.formatItemReference(item, format) || item.key,
                        display: zoteroRoam.utils.formatItemReference(item, display)};
            });
        },

        // RETIRED
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

        // RETIRED
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
