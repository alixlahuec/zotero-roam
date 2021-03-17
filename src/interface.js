;(()=>{
    zoteroRoam.interface = {
        icon: null,
        portal: {div: null, id: "zotero-data-importer-portal"},
        contextMenu: {
            div: null,
            class: "zotero-context-menu",
            overlay: {div: null, class: "zotero-context-overlay"},
            options: {list: [], class: "zotero-context-menu-option", labels: ["Import Zotero data to page"]},
            visible: false,
            targetElement: null,
            position({top, left}){
                zoteroRoam.interface.contextMenu.div.style.left = `${left}px`;
                zoteroRoam.interface.contextMenu.div.style.top = `${top}px`;
                zoteroRoam.interface.toggleContextOverlay("contextMenu", "show");
            }
        },
        iconContextMenu: {
            div: null,
            class: "zotero-icon-context-menu",
            overlay: {div: null, class: "zotero-icon-context-overlay"},
            options: {list: [], class: "zotero-icon-context-menu-option", labels: ["Update Zotero data", "Search in dataset..."]},
            visible: false,
            position({top, left}){
                zoteroRoam.interface.iconContextMenu.div.style.left = (left >= 0.9*window.innerWidth) ? `calc(${left}px - 10%)` : `${left}px`;
                zoteroRoam.interface.iconContextMenu.div.style.top = `calc(${top}px + 3%)`;
                zoteroRoam.interface.toggleContextOverlay("iconContextMenu", "show");
            }
        },
        search: {overlay: null, input: null, selectedItemDiv: null, closeButton: null, updateButton: null, visible: false},

        create(){
            zoteroRoam.interface.createIcon(id = "zotero-data-icon");
            zoteroRoam.interface.portal.div = zoteroRoam.interface.createPortal(id = zoteroRoam.interface.portal.id);
            zoteroRoam.interface.createContextMenu(elementKey = "contextMenu");
            zoteroRoam.interface.createContextMenu(elementKey = "iconContextMenu");
            zoteroRoam.interface.createSearchOverlay();
        },

        setup(){
            zoteroRoam.interface.icon.addEventListener("click", zoteroRoam.extension.toggle);

            zoteroRoam.interface.setupContextMenus(["contextMenu", "iconContextMenu"]);

            zoteroRoam.interface.search.updateButton.addEventListener("click", zoteroRoam.extension.update);
            zoteroRoam.interface.search.closeButton.addEventListener("click", function(){zoteroRoam.interface.toggleSearchOverlay("hide")});
            zoteroRoam.interface.search.input.addEventListener("rendered", zoteroRoam.interface.renderNbResults);

        },

        createIcon(id) {
            try{ document.getElementById(id).closest(".bp3-popover-wrapper").remove() } catch(e){};
            var button = document.createElement('span');
            button.classList.add('bp3-popover-wrapper');
            button.setAttribute("style", "margin-left: 4px;");
            button.innerHTML = `<span class="bp3-popover-target"><span id="${id}" status="off" class="bp3-button bp3-icon-manual bp3-minimal bp3-small"></span>`
            document.querySelector(".rm-topbar").appendChild(button);
        
            zoteroRoam.interface.icon = document.getElementById(id);
        },

        createPortal(id){
            try{ document.getElementById(id).remove() } catch(e){};
            var portalDiv = document.createElement("div");
            portalDiv.classList.add("bp3-portal");
            portalDiv.id = id;
            document.getElementById("app").appendChild(portalDiv);
            
            return portalDiv;
        },

        createContextMenu(elementKey){
            let config = zoteroRoam.interface[`${elementKey}`];
            try{ document.querySelector(`.${config.overlay.class}`).remove() } catch(e){};

            let backdropStyle = `z-index:25;`;
            let containerStyle = `width: auto; position: fixed;z-index:25;`;
            let menuOptions = config.options.labels.map(op => `<li class="${config.options.class}"><a class="bp3-menu-item bp3-popover-dismiss"><div class="bp3-fill bp3-text-overflow-ellipsis">${op}</div></a></li>`).join("");

            var overlayDiv = document.createElement("div");
            overlayDiv.classList.add("bp3-overlay");
            overlayDiv.classList.add("bp3-overlay-open");
            overlayDiv.classList.add(`${config.overlay.class}`);
            overlayDiv.style = `display:none;`;
            overlayDiv.innerHTML = `<div class="bp3-overlay-backdrop bp3-popover-backdrop bp3-popover-appear-done bp3-popover-enter-done" style="${backdropStyle}"></div>
                                    <div class="bp3-transition-container bp3-popover-appear-done bp3-popover-enter-done ${config.class}" style="${containerStyle}">
                                        <div class="bp3-popover bp3-minimal">
                                            <div class="bp3-popover-content">
                                                <div>
                                                    <ul class="bp3-menu bp3-text-small">
                                                        ${menuOptions}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`;

            zoteroRoam.interface.portal.div.appendChild(overlayDiv);
            zoteroRoam.interface[`${elementKey}`].overlay.div = document.querySelector(`.${zoteroRoam.interface[`${elementKey}`].overlay.class}`);
            zoteroRoam.interface[`${elementKey}`].div = document.querySelector(`.${zoteroRoam.interface[`${elementKey}`].class}`);
            zoteroRoam.interface[`${elementKey}`].options.list = document.querySelectorAll(`.${zoteroRoam.interface[`${elementKey}`].options.class}`);
        },
        // Works but ugly/long ; also, should probably move the IDs/classes in the Object above/the params at some point
        createSearchOverlay(){
            try{ document.querySelector(".zotero-search-overlay").remove() } catch(e){};

            let searchOverlay = document.createElement("div");
            searchOverlay.classList.add("bp3-overlay");
            searchOverlay.classList.add("bp3-overlay-open");
            searchOverlay.classList.add("bp3-overlay-scroll-container");
            searchOverlay.classList.add("zotero-search-overlay");
            searchOverlay.style = "display:none;"
        
            let searchOverlayBackdrop = document.createElement("div");
            searchOverlayBackdrop.classList.add("bp3-overlay-backdrop");
            searchOverlayBackdrop.classList.add("bp3-overlay-appear-done");
            searchOverlayBackdrop.classList.add("bp3-overlay-enter-done");
            searchOverlayBackdrop.classList.add("zotero-search-backdrop");
            searchOverlayBackdrop.tabIndex = "0";
        
            let searchDialogContainer = document.createElement("div");
            searchDialogContainer.classList.add("bp3-dialog-container");
            searchDialogContainer.classList.add("bp3-overlay-content");
            searchDialogContainer.classList.add("bp3-overlay-appear-done");
            searchDialogContainer.classList.add("bp3-overlay-enter-done");
            searchDialogContainer.tabIndex = "0";
        
            let searchDialogDiv = document.createElement("div");
            searchDialogDiv.classList.add("bp3-dialog");
            searchDialogDiv.style = "width:60%;align-self:baseline;";
        
            let searchDialogHeader = document.createElement("div");
            searchDialogHeader.classList.add("bp3-dialog-header");
            
            let searchDialogBody = document.createElement("div");
            searchDialogBody.classList.add("bp3-dialog-body");
        
            let searchDialogFooter = document.createElement("div");
            searchDialogFooter.classList.add("bp3-dialog-footer");
        
            // Add header elements
            searchDialogHeader.innerHTML = `<label class="bp3-control bp3-switch" style="margin-bottom:0px;flex: 1 1 auto;">
                                            <input id="zotero-quick-copy-mode" type="checkbox"><span class="bp3-control-indicator"></span>Quick Copy</label>
                                            <button type="button" aria-label="Close" class="zotero-search-close bp3-button bp3-minimal bp3-dialog-close-button">
                                            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>`
        
            // Add body elements
            let parText = document.createElement("p");
            parText.innerHTML = `<strong>Enter text below to look for items* in your loaded Zotero dataset.</strong>
                            <br>(* searchable fields are : title, year, authors, tags, citekey. A more fully-featured search will be available down the road)`
            searchDialogBody.appendChild(parText);

            let inputGroup = document.createElement('div');
            inputGroup.classList.add("bp3-input-group");
        
            let searchBar = document.createElement('input');
            searchBar.id = "zotero-search-autocomplete";
            searchBar.tabIndex = "1";
            searchBar.type = "text";
            searchBar.classList.add("bp3-input");
            searchBar.classList.add("bp3-fill");
            searchBar.style = "margin-bottom:20px;"
            inputGroup.appendChild(searchBar);
            searchDialogBody.appendChild(inputGroup);
        
            let selectedItemDiv = document.createElement('div');
            selectedItemDiv.id = "zotero-search-selected-item";
            selectedItemDiv.classList.add("bp3-card");
            selectedItemDiv.style = "width:95%;margin:0 auto;display:none;";
        
            let selectedItemMetadata = document.createElement('div');
            selectedItemMetadata.classList.add("selected-item-header");
            let selectedItemGraphInfo = document.createElement('div');
            selectedItemGraphInfo.classList.add("selected-item-body");
        
            selectedItemDiv.appendChild(selectedItemMetadata);
            selectedItemDiv.appendChild(selectedItemGraphInfo);
        
            searchDialogBody.appendChild(selectedItemDiv);
        
            // Add footer elements
            searchDialogFooter.innerHTML = `<div class="bp3-dialog-footer-actions">
                                            <input class="bp3-input clipboard-copy-utility" type="text" readonly style="opacity:0;">
                                            <span class="bp3-popover2-target" tabindex="0">
                                                <button type="button" class="zotero-update-data bp3-button">
                                            <span class="bp3-button-text">Update Zotero data</span>
                                            </button></span></div>`
        
            // Chain up all the DOM elements
        
            searchDialogDiv.appendChild(searchDialogHeader);
            searchDialogDiv.appendChild(searchDialogBody);
            searchDialogDiv.appendChild(searchDialogFooter);
        
            searchDialogContainer.appendChild(searchDialogDiv);
        
            searchOverlay.appendChild(searchOverlayBackdrop);
            searchOverlay.appendChild(searchDialogContainer);
        
            zoteroRoam.interface.portal.div.appendChild(searchOverlay);
            zoteroRoam.interface.search.overlay = document.querySelector(".zotero-search-overlay");

            zoteroRoam.interface.search.input = document.querySelector("#zotero-search-autocomplete");
            zoteroRoam.interface.search.selectedItemDiv = document.querySelector("#zotero-search-selected-item");
            zoteroRoam.interface.search.closeButton = document.querySelector("button.zotero-search-close");
            zoteroRoam.interface.search.updateButton = document.querySelector("button.zotero-update-data");
        },

        setupContextMenus(elementsKeys){
            window.addEventListener("click", e => {
                elementsKeys.forEach(key => {
                    if(zoteroRoam.interface[`${key}`].visible){
                        zoteroRoam.interface.toggleContextOverlay(key, command = "hide");
                    }
                })
            });

            elementsKeys.forEach(key => {
                zoteroRoam.interface[`${key}`].options.list.forEach( (op, index) => {
                    switch(zoteroRoam.interface[`${key}`].options.labels[index]){
                        case "Import Zotero data to page":
                            op.addEventListener("click", function(){zoteroRoam.handlers.addItemData(zoteroRoam.interface.contextMenu.targetElement)})
                            break;
                        case "Update Zotero data":
                            op.addEventListener("click", zoteroRoam.extension.update)
                            break;
                        case "Search in dataset...":
                            op.addEventListener("click", function(){zoteroRoam.interface.toggleSearchOverlay("show")});
                    }
                })
            })
        },

        toggleContextOverlay(elementKey, command){
            zoteroRoam.interface[`${elementKey}`].overlay.div.style.display = (command == "show") ? "block" : "none";
            zoteroRoam.interface[`${elementKey}`].visible = (command == "show") ? true : false;
        },

        toggleSearchOverlay(command) {
            zoteroRoam.interface.search.overlay.style.display = command === "show" ? "block" : "none";
            if (command == "show") {
                console.log("Opening the Search Panel")
                zoteroRoam.interface.search.input.focus();
                zoteroRoam.interface.search.input.value = "";
                zoteroRoam.interface.search.visible = true
            } else {
                console.log("Closing the Search Panel")
                zoteroRoam.interface.clearSelectedItem();
                zoteroRoam.interface.search.input.value = "";
                document.querySelector('input.clipboard-copy-utility').value = "";
                zoteroRoam.interface.search.visible = false
            }
        },

        popContextOverlay(e, elementKey){
            e.preventDefault();
            const origin = {
                left: e.pageX,
                top: e.pageY
            };
            zoteroRoam.interface[`${elementKey}`].position(origin);
            if(elementKey == "contextMenu"){ zoteroRoam.interface.contextMenu.targetElement = e.target; };
            return false;
        },

        popContextMenu(e){
            zoteroRoam.interface.popContextOverlay(e, "contextMenu");
        },

        popIconContextMenu(e){
            zoteroRoam.interface.popContextOverlay(e, "iconContextMenu");
        },

        renderNbResults(e){
            let resultsText = "";
            if(e.detail.results.length > 0){
                resultsText = `Showing ${e.detail.results.length} out of ${e.detail.matches.length} results`;
            }
            document.querySelector("#zotero-search-results-list").setAttribute("aria-label", resultsText);
        },

        renderSelectedItem(feedback){

            let selectedItem = zoteroRoam.data.items.find(it => it.key == feedback.selection.value.key);
            let citekey = '@' + feedback.selection.value.key;
            let itemYear = feedback.selection.value.year ? `(${feedback.selection.value.year})` : "";
        
            // Generate list of authors as bp3 tags or Roam page references
            let infoAuthors = feedback.selection.value.authorsFull;
            let infoRolesAuthors = feedback.selection.value.authorsRoles;
            let divAuthors = "";
            if(infoAuthors.length > 0){
                for(i=0; i < infoAuthors.length; i++){
                    let authorInGraph = zoteroRoam.utils.lookForPage(title = infoAuthors[i]);
                    let authorElem = (authorInGraph.present == true) ? zoteroRoam.utils.renderPageReference(title = infoAuthors[i], uid = authorInGraph.uid) : zoteroRoam.utils.renderBP3Tag(string = infoAuthors[i], {modifier: "bp3-intent-primary bp3-round"});
                    let authorRole = (infoRolesAuthors[i] && infoRolesAuthors[i] != "author") ? (` (${infoRolesAuthors[i]})`) : "";
                    divAuthors = divAuthors + authorElem + authorRole;
                    if(i < infoAuthors.length - 2){
                        divAuthors = divAuthors + ", ";
                    } else if(i == infoAuthors.length - 2){
                        divAuthors = divAuthors + " & ";
                    }
                }
            } 
            // Generate list of tags as bp3 tags or Roam tags
            let infoTags = feedback.selection.value.tags;
            let divTags = "";
            if(infoTags.length > 0){
                for(i=0; i < infoTags.length; i++){
                    let tagInGraph = zoteroRoam.utils.lookForPage(title = infoTags[i]);
                    let tagElem = (tagInGraph.present == true) ? zoteroRoam.utils.renderPageTag(title = infoTags[i]) : zoteroRoam.utils.renderBP3Tag(string = infoTags[i]);
                    divTags = divTags + tagElem + " ";
                }
            }

            // Generate list of collections (names) as bp3 tags
            let infoCollections = zoteroRoam.formatting.getItemCollections(selectedItem);
            let divCollections = "";
            if(infoCollections){
                try {
                    divCollections = infoCollections.map(collec => zoteroRoam.utils.renderBP3Tag(string = collec.data.name, { modifier: "bp3-intent-success bp3-round", icon: "projects" })).join(" ");
                } catch(e){
                    console.log(infoCollections);
                    console.log(e);
                    console.error("Something went wrong while getting the item's collections data");
                }
            };

            // Information about the item
            let pageInGraph = zoteroRoam.utils.lookForPage(citekey);
            let iconName = (pageInGraph.present == true) ? "tick" : "cross";
            let iconIntent = (pageInGraph.present == true) ? "success" : "danger";
            let itemInfo = (pageInGraph.present == true) ? `In the graph` : "Not in the graph";
            if(pageInGraph.present == true){
                try{
                    let nbChildren = window.roamAlphaAPI.q('[:find (count ?chld) :in $ ?uid :where[?p :block/uid ?uid][?p :block/children ?chld]]', pageInGraph.uid)[0][0];
                    itemInfo = itemInfo + ` (has <b>${nbChildren}</b> direct children)`;
                } catch(e){};
            }
            let itemInGraph = `<div style="padding:0 10px;font-style:italic;" class="item-in-graph"><span class="bp3-icon-${iconName} bp3-icon bp3-intent-${iconIntent}"></span><span> ${itemInfo}</span></div>`;
            
            // Render the header section
            let headerDiv = document.querySelector(".selected-item-header");
            headerDiv.innerHTML = `<div class="item-basic-metadata">
                                        <h4 class="item-title" tabindex="0">${feedback.selection.value.title}${itemYear}</h4>
                                        <p class="item-metadata-string">${divAuthors}${feedback.selection.value.meta}</p>
                                        </div>
                                    <div class="item-citekey">
                                        <div class="bp3-control-group">
                                            <div class="bp3-input-group bp3-fill"><input type="text" class="bp3-input" value="${citekey}" readonly></div>
                                            <button type="button" class="bp3-button item-copy-citekey" style="background-color:unset;"><span icon="clipboard" class="bp3-icon bp3-icon-clipboard item-copy-citekey-icon"></span></button>
                                        </div>
                                        <div class="bp3-button-group bp3-fill bp3-minimal copy-buttons">
                                            <a class="bp3-button" format="citekey">Copy @citekey</a>
                                            <a class="bp3-button" format="citation">[Citation]([[@]])</a>
                                            <a class="bp3-button" format="tag">#@</a>
                                            <a class="bp3-button" format="page-reference">[[@]]</a>
                                        </div>
                                        ${itemInGraph}
                                    </div>`;
        
            // Render the graph info section
            let bodyDiv = document.querySelector(".selected-item-body");
            
            let goToPageModifier = (pageInGraph.present == true) ? `data-uid="${pageInGraph.uid}"` : "disabled";
            let goToPageSeq = (zoteroRoam.shortcuts.sequences["goToItemPage"]) ? zoteroRoam.shortcuts.makeSequenceText("goToItemPage", pre = " ") : "";
            let goToPageText = `Go to Roam page  ${goToPageSeq}`;
            let goToPage = zoteroRoam.utils.renderBP3ButtonGroup(string = goToPageText, { buttonClass: "item-go-to-page", icon: "arrow-right", modifier: "bp3-intent-primary", buttonModifier: `${goToPageModifier}` });
            
            let importSeq = (zoteroRoam.shortcuts.sequences["importMetadata"]) ? zoteroRoam.shortcuts.makeSequenceText("importMetadata", pre = " ") : "";
            let importText = `Import metadata  ${importSeq}`;
            let importButtonGroup = zoteroRoam.utils.renderBP3ButtonGroup(string = importText, { buttonClass: "item-add-metadata", icon: "add", modifier: "bp3-intent-primary" });

            // Check for children items
            let infoChildren = zoteroRoam.formatting.getItemChildren(selectedItem, { pdf_as: "raw", notes_as: "raw" });
            let childrenDiv = "";
            if(infoChildren.remoteChildren){
                childrenDiv += `<p>This item has children, but they were not returned by the API data request. This might be due to a request for 'items/top' rather than 'items'.</p>`;
            } else {
                try {
                    let pdfDiv = (!infoChildren.pdfItems) ? `No PDF attachments` : infoChildren.pdfItems.map(item => {
                        let pdfHref = (item.data.linkMode == "linked_file") ? `zotero://open-pdf/library/items/${item.data.key}` : item.data.url;
                        let pdfLink = `<a href="${pdfHref}">${item.data.title}</a>`;
                        return zoteroRoam.utils.renderBP3ButtonGroup(string = pdfLink, { icon: "document-open" });
                    });
                    childrenDiv += pdfDiv;
                    let notesDiv = (!infoChildren.notes) ? "" : zoteroRoam.utils.renderBP3ButtonGroup(string = "Show notes below", { buttonClass: "item-see-notes", icon: "comment" });
                    childrenDiv += notesDiv;
                } catch(e){
                    console.log(infoChildren);
                    console.log(pdfDiv);
                    console.log(e);
                    console.log("Something went wrong while getting the item's children data");
                }
            }
            
            bodyDiv.innerHTML = `<div class="item-additional-metadata">
                                    <p class="item-abstract">${feedback.selection.value.abstract}</p>
                                    <p class="item-tags">${divTags}</p>
                                    <p class="item-collections">${divCollections}</p>
                                </div>
                                <div class="item-actions">
                                    ${goToPage}
                                    ${importButtonGroup}
                                    <div class="item-pdf-notes" style="margin-top: 25px;">
                                        <h5>PDFs & Notes</h5>
                                        ${childrenDiv}
                                    </div>
                                </div>
                                <div class="item-rendered-notes">
                                </div>`;
            
            // Add event listeners to action buttons
            let pageUID = (pageInGraph.uid) ? pageInGraph.uid : "";
            document.querySelector("button.item-add-metadata").addEventListener("click", function(){
                console.log("Importing metadata...");
                zoteroRoam.handlers.addSearchResult(citekey, pageUID);
            });
            document.querySelector("button.item-go-to-page").addEventListener("click", function(){
                window.location.href = `https://roamresearch.com/${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${document.querySelector("button.item-go-to-page").dataset.uid}`;
                zoteroRoam.interface.toggleSearchOverlay("hide");
            });
            document.querySelector("button.item-copy-citekey").addEventListener("click", function(){
                document.querySelector(".item-citekey input").select();
                document.execCommand("copy");
                document.querySelector("span.item-copy-citekey-icon").classList.add("bp3-intent-success");
                document.querySelector('h4.item-title').focus();
            });
            Array.from(document.querySelectorAll('.item-citekey .copy-buttons a.bp3-button[format]')).forEach(btn => {
                btn.addEventListener("click", e => {
                    switch(btn.getAttribute('format')){
                        case 'citekey':
                            document.querySelector('input.clipboard-copy-utility').value = `${citekey}`;
                            break;
                        case 'citation':
                            document.querySelector('input.clipboard-copy-utility').value = `[${feedback.selection.value.authors}]([[${citekey}]])`;
                            break;
                        case 'tag':
                            document.querySelector('input.clipboard-copy-utility').value = `#[[${citekey}]]`;
                            break;
                        case 'page-reference':
                            document.querySelector('input.clipboard-copy-utility').value = `[[${citekey}]]`;
                    };
                    document.querySelector('input.clipboard-copy-utility').select();
                    document.execCommand("copy");
                })
            });
            try{
                document.querySelector("button.item-see-notes").addEventListener("click", function(){
                    document.querySelector("div.item-rendered-notes").innerHTML = `<hr><h4>Notes</h4><br>${ infoChildren.notes.map(n => n.data.note).join("<br>") }`;
                });
            } catch(e){};

            // Finally, make the div visible
            zoteroRoam.interface.search.selectedItemDiv.style.display = "block";
            document.querySelector('h4.item-title').focus();
        },

        clearSelectedItem(){
            try {
                zoteroRoam.interface.search.selectedItemDiv.children.forEach(c => {c.innerHTML = ``});
            } catch(e){
                Array.from(zoteroRoam.interface.search.selectedItemDiv.children).forEach(c => {c.innerHTML = ``});
            }
            zoteroRoam.interface.search.selectedItemDiv.style.display = "none";
        }
    }
})();
