;(()=>{
    zoteroRoam.events = {
        /**
         * Signals the extensiom has loaded successfully
         * @event zotero-roam:ready
         */
        'ready': {},
        /**
         * Signals a page menu has been rendered
         * @event zotero-roam:menu-ready
         */
        'menu-ready': {},
        /**
         * Signals a metadata import has terminated
         * @event zotero-roam:metadata-added
         */
        'metadata-added': {},
        /**
         * Signals a notes import has terminated
         * @event zotero-roam:notes-added
         */
        'notes-added': {},
        /**
         * Signals a data update has terminated
         * @event zotero-roam:update
         */
        'update': {},
        /**
         * Signals a write call has terminated
         * @event zotero-roam:write
         */
        'write': {},
        /**
         * Emits a custom event for the extension
         * @alias zoteroRoam.events.emit
         * @param {string} type - The suffix of the event to be emitted
         * @param {object} detail - The object containing the event's detail
         * @param {Element} target - The DOM target on which the event should be emitted 
         */
        emit(type, detail = {}, target = document){
            let e = new CustomEvent(`zotero-roam:${type}`, {bubbles: true, cancelable: true, detail: detail});
            if(zoteroRoam.config.userSettings.logEvents == true){
                console.log(e);
            }
            target.dispatchEvent(e);
        },

        defaultHooks(){
            document.addEventListener("zotero-roam:metadata-added", (e) => {
                // Update item-in-graph display, if applicable
                try {
                    let inGraphDiv = document.querySelector(".item-in-graph");
                    if(inGraphDiv != null){
                        inGraphDiv.innerHTML = `<span class="bp3-icon-tick bp3-icon bp3-intent-success"></span><span> In the graph</span>`;
                    }
                    let goToPageButton = document.querySelector(".item-go-to-page");
                    if(goToPageButton != null){
                        goToPageButton.setAttribute("data-uid", e.detail.uid);
                        goToPageButton.setAttribute("href", `https://roamresearch.com/${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${e.detail.uid}`);
                        goToPageButton.removeAttribute("disabled");
                    }
                } catch(e){};
                // Update auxiliary dialog, if applicable
                try {
                    let auxItem = document.querySelector(`.zotero-roam-auxiliary-overlay .bp3-menu-item[label="${e.detail.title.slice(1)}"]`);
                    if(auxItem != null){
                        auxItem.setAttribute('in-graph', 'true');
                        auxItem.querySelector('.zotero-roam-add-to-graph').remove();
                    }
                } catch(e){};
                // Update on-page menu backlink, if applicable
                try {
                    let backlinks = Array.from(document.querySelectorAll(`.related-item_listed[data-key="${e.detail.title}"][in-graph="false"]`));
                    if(backlinks.length > 0){
                        for(link of backlinks){
                            link.outerHTML = zoteroRoam.inPage.renderBacklinksItem(paper = e.detail.item, type = link.getAttribute('item-type'), uid = e.detail.uid);
                        }
                    }
                } catch(e){};
            });

            document.addEventListener("zotero-roam:update", async function(e){
                let updatedItems = e.detail.data ? e.detail.data.items : [];
                if(updatedItems.length > 0){
                    for(item of updatedItems){
                        if(item.data.DOI){
                            // --- DNP buttons
                            let dnpButtons = Array.from(document.querySelectorAll('.zotero-roam-page-added-on'));
                            if(dnpButtons.length > 0){
                                let itemDate = zoteroRoam.utils.makeDNP(item.data.dateAdded, {brackets: false});
                                for(btn of dnpButtons){
                                    if(btn.getAttribute('data-title') != itemDate){
                                        continue;
                                    } else {
                                        let btnKeys = JSON.parse(btn.getAttribute('data-keys'));
                                        if(!btnKeys.includes(item.key)){
                                            if(!btnKeys.includes(item.data.key)){
                                                btn.setAttribute('data-keys', JSON.stringify(btnKeys.push(item.key)));
                                            } else {
                                                // Special case where the item's citekey was updated
                                                btn.setAttribute('data-keys', JSON.stringify(btnKeys.filter(k => k != item.data.key).push(item.key)));
                                            }
                                            let newKeysCount = JSON.parse(btn.getAttribute('data-keys')).length;
                                            btn.querySelector('.bp3-button-text').innerText =  `${newKeysCount} item${newKeysCount == 1 ? "" : "s"} added`
                                        }
                                    }
                                }
                            }
                            // --- Tagged with / Abstract Mentions
                            let taggedButtons = Array.from(document.querySelectorAll('.zotero-roam-page-tagged-with'));
                            if(taggedButtons.length > 0){
                                for(btn of taggedButtons){
                                    let pageTitle = btn.getAttribute('data-title');
                                    let btnKeys = JSON.parse(btn.getAttribute('data-keys'));
                                    if(item.data.tags && item.data.tags.map(t => t.tag).includes(pageTitle)){
                                        if(!btnKeys.includes(item.key)){
                                            if(!btnKeys.includes(item.data.key)){
                                                btn.setAttribute('data-keys', JSON.stringify([...btnKeys, item.key]));
                                            } else {
                                                // Special case where the item's citekey was updated
                                                btn.setAttribute('data-keys', JSON.stringify([...btnKeys.filter(k => k != item.data.key), item.key]));
                                            }
                                            let newKeysCount = JSON.parse(btn.getAttribute('data-keys')).length;
                                            btn.querySelector('.bp3-button-text').innerText = `${newKeysCount} tagged item${newKeysCount == 1 ? "" : "s"}`;
                                        }
                                    }
                                    
                                }
                            }
                            let abstractButtons = Array.from(document.querySelectorAll('.zotero-roam-page-abstract-mentions'));
                            if(abstractButtons.length > 0){
                                for(btn of abstractButtons){
                                    let pageTitle = btn.getAttribute('data-title');
                                    let btnKeys = JSON.parse(btn.getAttribute('data-keys'));
                                    if(item.data.abstractNote && item.data.abstractNote.includes(pageTitle)){
                                        if(!btnKeys.includes(item.key)){
                                            if(!btnKeys.includes(item.data.key)){
                                                btn.setAttribute('data-keys', JSON.stringify([...btnKeys, item.key]));
                                            } else {
                                                // Special case where the item's citekey was updated
                                                btn.setAttribute('data-keys', JSON.stringify([...btnKeys.filter(k => k != item.data.key), item.key]));
                                            }
                                            let newKeysCount = JSON.parse(btn.getAttribute('data-keys')).length;
                                            btn.querySelector('.bp3-button-text').innerText = `${newKeysCount} abstract${newKeysCount == 1 ? "" : "s"}`;
                                        }
                                    }
                                    
                                }
                            }
                            // --- Citekey menus (through DOI)
                            if(item.data.DOI && zoteroRoam.config.params.pageMenu.defaults.includes("citingPapers")){
                                let itemDOI = zoteroRoam.utils.parseDOI(item.data.DOI);
                                let pageMenus = Array.from(document.querySelectorAll('.zotero-roam-page-menu-citations[data-doi]'));
                                for(menu of pageMenus){
                                    let doi = menu.dataset.doi;
                                    let citeObject = await zoteroRoam.handlers.getSemantic(doi);
                                    if(citeObject.data){
                                        let citingDOIs = citeObject.citations.filter(cit => cit.doi).map(cit => cit.doi);
                                        let citedDOIs = citeObject.references.filter(ref => ref.doi).map(ref => ref.doi);
                                        let allDOIs = [...citingDOIs, ...citedDOIs];
                                        if(zoteroRoam.utils.includes_anycase(allDOIs, itemDOI)){
                                            let papersInLib = allDOIs.map(doi => zoteroRoam.data.items.filter(it => it.data.DOI).find(it => zoteroRoam.utils.parseDOI(it.data.DOI).toLowerCase() == doi.toLowerCase())).filter(Boolean);
                                            papersInLib.forEach((paper, index) => {
                                                let cleanDOI = zoteroRoam.utils.parseDOI(paper.data.DOI);
                                                if(zoteroRoam.utils.includes_anycase(citingDOIs, cleanDOI)){
                                                    papersInLib[index].type = "citing";
                                                } else {
                                                    papersInLib[index].type = "cited";
                                                }
                                            });
                                            let relatedBtn = menu.querySelector('.zotero-roam-page-menu-backlinks-button');
                                            relatedBtn.querySelector('.bp3-button-text').innerText = `${papersInLib.length} related library items`;
                                            relatedBtn.classList.remove('bp3-disabled');

                                            let relatedList = menu.querySelector('.zotero-roam-page-menu-backlinks-list');
                                            if(!relatedList){
                                                menu.innerHTML += `
                                                <ul class="zotero-roam-page-menu-backlinks-list bp3-list-unstyled bp3-text-small" style="display:none;">
                                                ${zoteroRoam.inPage.renderBacklinksList(papersInLib)}
                                                </ul>
                                                `
                                            } else {
                                                relatedList.innerHTML = `${zoteroRoam.inPage.renderBacklinksList(papersInLib)}`;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                // --- Deleted items
            })
        }
    }
})();
