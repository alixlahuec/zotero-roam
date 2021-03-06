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
                zoteroRoam.interface.contextMenu.style.left = `${left}px`;
                zoteroRoam.interface.contextMenu.style.top = `${top}px`;
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
                zoteroRoam.interface.iconContextMenu.style.left = (left >= 0.9*window.innerWidth) ? `calc(${left}px - 7%)` : `${left}px`;
                zoteroRoam.interface.iconContextMenu.style.top = `calc(${top}px + 3%)`;
                zoteroRoam.interface.toggleContextOverlay("iconContextMenu", "show");
            }
        },
        search: {div: null, overlay: null, input: null, selectedItemDiv: null, quickCopyToggle: null, closeButton: null, updateButton: null, visible: false},

        create(){
            zoteroRoam.interface.icon = zoteroRoam.interface.createIcon(id = "zotero-data-icon");
            zoteroRoam.interface.portal.div = zoteroRoam.interface.createPortal(id = zoteroRoam.interface.portal.id);
            zoteroRoam.interface.createContextMenu(elementKey = "contextMenu");
            zoteroRoam.interface.createContextMenu(elementKey = "iconContextMenu");
            zoteroRoam.interface.createSearchOverlay();
        },

        setup(){
            zoteroRoam.interface.icon.onclick = zoteroRoam.extension.toggle();

            zoteroRoam.interface.setupContextMenus(["contextMenu", "iconContextMenu"]);
            zoteroRoam.interface.icon.addEventListener("contextmenu", addListenerToZoteroIcon);

            zoteroRoam.interface.search.updateButton.addEventListener("click", zoteroRoam.extension.update);
            zoteroRoam.interface.search.closeButton.addEventListener("click", function(){zoteroRoam.interface.toggleSearchOverlay("hide")});
            zoteroRoam.interface.search.input.addEventListener("rendered", zoteroRoam.interface.renderNbResults);

        },

        createIcon(id) {
            try{ document.getElementById(id).remove() } catch(e){};
            var button = document.createElement('span');
            button.classList.add('bp3-popover-wrapper');
            button.setAttribute("style", "margin-left: 4px;");
            button.innerHTML = `<span class="bp3-popover-target"><span id="${id}" status="off" class="bp3-button bp3-icon-manual bp3-minimal bp3-small"></span>`
            document.querySelector(".rm-topbar").appendChild(button);
        
            return button;
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
                                            <span style="font-style:italic;">Press Esc or Alt-Q to exit</span>
                                            <button type="button" aria-label="Close" class="zotero-search-close bp3-button bp3-minimal bp3-dialog-close-button">
                                            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"><svg data-icon="small-cross" width="20" height="20" viewBox="0 0 20 20"><desc>small-cross</desc><path d="M11.41 10l3.29-3.29c.19-.18.3-.43.3-.71a1.003 1.003 0 00-1.71-.71L10 8.59l-3.29-3.3a1.003 1.003 0 00-1.42 1.42L8.59 10 5.3 13.29c-.19.18-.3.43-.3.71a1.003 1.003 0 001.71.71l3.29-3.3 3.29 3.29c.18.19.43.3.71.3a1.003 1.003 0 00.71-1.71L11.41 10z" fill-rule="evenodd"></path></svg></span></button>`
        
            // Add body elements
            let parText = document.createElement("p");
            parText.innerHTML = `<strong>Enter text below to look for items* in your loaded Zotero dataset.</strong>
                            <br>(* searchable fields are : title, year, authors, tags. A more fully-featured search will be available down the road)`
            searchDialogBody.appendChild(parText);
        
            let searchBar = document.createElement('input');
            searchBar.id = "zotero-search-autocomplete";
            searchBar.tabIndex = "1";
            searchBar.type = "text";
            searchBar.classList.add("bp3-input");
            searchBar.classList.add("bp3-fill");
            searchBar.style = "margin-bottom:20px;"
            searchDialogBody.appendChild(searchBar);
        
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
            zoteroRoam.interface.search.quickCopyToggle = document.querySelector("#zotero-quick-copy-mode");
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
                zoteroRoam.interface.search.input.focus();
                zoteroRoam.interface.search.visible = true
            } else {
                zoteroRoam.interface.clearSelectedItem();
                zoteroRoam.interface.search.input.value = "";
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

        renderNbResults(e){
            let resultsText = "";
            if(e.detail.results.length > 0){
                resultsText = `Showing ${e.detail.results.length} out of ${e.detail.matches.length} results`;
            }
            document.querySelector("#zotero-search-results-list").setAttribute("aria-label", resultsText);
        },

        renderSelectedItem(feedback){

            let citekey = '@' + feedback.selection.value.key;
            let itemYear = (feedback.selection.value.year) ? (" (" + feedback.selection.value.year + ")") : "";
        
            // Generate list of authors as bp3 tags or Roam page references
            let infoAuthors = feedback.selection.value.authorsFull;
            let infoRolesAuthors = feedback.selection.value.authorsRoles;
            let divAuthors = "";
            if(infoAuthors.length > 0){
                for(i=0; i < infoAuthors.length; i++){
                    let authorInGraph = zoteroRoam.utils.lookForPage(title = infoAuthors[i]);
                    let authorElem = (authorInGraph.present == true) ? zoteroRoam.utils.renderPageReference(title = infoAuthors[i], uid = authorInGraph.uid) : zoteroRoam.utils.renderBP3Tag(string = infoAuthors[i], modifier = "bp3-intent-primary bp3-round");
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
        
            // Information about the item
            let pageInGraph = zoteroRoam.utils.lookForPage(citekey);
            
            // Render the header section
            let headerDiv = document.querySelector(".selected-item-header");
            headerDiv.innerHTML = `<div class="item-basic-metadata">
                                        <h4 class="item-title">${feedback.selection.value.title}${itemYear}</h4>
                                        <p class="item-metadata-string">${divAuthors}${feedback.selection.value.meta}</p>
                                        </div>
                                    <div class="item-citekey">
                                        <div class="bp3-control-group">
                                            <div class="bp3-input-group bp3-fill"><input type="text" class="bp3-input" value="${citekey}" readonly></div>
                                            <button type="button" class="bp3-button item-copy-citekey"><span icon="clipboard" class="bp3-icon bp3-icon-clipboard"></span></button>
                                        </div>
                                    </div>`;
        
            // Render the graph info section
            let bodyDiv = document.querySelector(".selected-item-body");
            let pageUID = (pageInGraph.uid) ? pageInGraph.uid : "";
            let iconName = (pageInGraph.present == true) ? "tick" : "cross";
            let iconIntent = (pageInGraph.present == true) ? "success" : "danger";
            let itemInfo = (pageInGraph.present == true) ? (`Page already exists in the graph`) : "Page doesn't exist in the graph";
        
            bodyDiv.innerHTML = `<div class="item-additional-metadata">
                                    <p class="item-abstract">${feedback.selection.value.abstract}</p>
                                    <p class="item-tags">${divTags}</p>
                                </div>
                                <div class="item-actions">
                                    <div style="padding:5px 10px;font-style:italic;"><span class="bp3-icon-${iconName} bp3-icon bp3-intent-${iconIntent}"></span><span> ${itemInfo}</span></div>
                                    <div class="bp3-button-group bp3-minimal bp3-vertical bp3-align-left">
                                    <button type="button" class="bp3-button item-add-metadata">
                                        <span icon="add" class="bp3-icon bp3-icon-add bp3-intent-primary"></span>
                                        <span class="bp3-button-text">Import metadata</span>
                                    </button>
                                    </div>
                                </div>`;
            
            // Add event listeners to action buttons
            document.querySelector("button.item-add-metadata").addEventListener("click", function(){zoteroRoam.handlers.addSearchResult(citekey, pageUID)});
            document.querySelector("button.item-copy-citekey").addEventListener("click", function(){document.querySelector(".item-citekey input").select(); document.execCommand("copy");document.querySelector(".item-citekey input").blur();})
        
            // Finally, make the div visible
            zoteroRoam.interface.search.selectedItemDiv.style.display = "block";
        },

        clearSelectedItem(){
            zoteroRoam.interface.search.selectedItemDiv.children.forEach(c => {c.innerHTML = ``})
            zoteroRoam.interface.search.selectedItemDiv.style.display = "none";
        }
    }
})();
