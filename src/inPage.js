;(()=>{
    zoteroRoam.inPage = {
        /** Rigs ref-citekey elements that are in the dataset with a listener for context menu */
        addContextMenuListener() {
            var refCitekeys = document.querySelectorAll(".ref-citekey");
            for (var i = 0; i < refCitekeys.length; i++) {
                var ref = refCitekeys[i];
        
                // Handle case where item hasn't been checked against data yet
                if(!ref.dataset.zoteroBib){
                    if(zoteroRoam.data.items.find(libItem => libItem.key == ref.dataset.linkTitle.replace("@", ""))){
                        ref.dataset.zoteroBib = "inLibrary";
                    } else {
                        ref.dataset.zoteroBib = "notFound";
                    }
                }
        
                // Only add a listener for context menu if the item has been found in the library
                if (ref.dataset.zoteroBib == "inLibrary") {
                    // Robust regardless of brackets
                        ref.querySelector('.rm-page-ref').addEventListener("contextmenu", zoteroRoam.interface.popContextMenu);
                }
            }
        },

        /** Checks references for new citekeys, then checks data for the citekeys and adds a listener to them
         * @param {boolean} update - Should old references be re-checked ? */
        checkReferences(update = false){
            let refCitekeyFound = false;
            setTimeout(function(){
                do {
                    let refs = document.getElementsByClassName("rm-page-ref");
                    refCitekeyFound = zoteroRoam.inPage.identifyCitekeys(refs);
                } while (refCitekeyFound == true);
            }, 300);
            zoteroRoam.inPage.checkCitekeys(update = update);
            zoteroRoam.inPage.addContextMenuListener();
        },

        /** Scans page references to find new citekeys (do not have the 'ref-citekey' custom class)
         * @param {Element[]} refs = The Array of page references to be scanned
         * @returns {boolean} Was there a new citekey found ? */
        identifyCitekeys(refs){
            let matched = false;
            for (i = 0; i < refs.length; i++) {
                let parentDiv = refs[i].parentElement;
                if (typeof (parentDiv.dataset.linkTitle) === 'undefined') {
                    continue;
                } else {
                    // Only do this for page refs for now, we'll see about tags later or not at all
                    if (parentDiv.dataset.linkTitle.startsWith("@")) {
                        if (parentDiv.classList.contains("ref-citekey")) {
                            matched = false;
                        } else {
                            parentDiv.classList.add("ref-citekey");
                            matched = true;
                        }
                    }
                }
            }
            return matched;
        },
        
        /** Verifies if citekeys in the current view are present in the loaded dataset
         * @param {boolean} update - Should the extension also verify citekeys that had been checked previously ? */
        checkCitekeys(update = false){
            let refCitekeys = document.querySelectorAll('.ref-citekey');
            let newMatches = 0;
            let newUnmatches = 0;

            refCitekeys.forEach(ref => {
                // References that have a data-zotero-bib attribute have already been checked -- use param `update` to see if we should check again
                if (ref.dataset.zoteroBib) {
                    // If `update` is set to 'false', we don't bother checking anything & continue
                    if(update == true){
                        // If `update` is set to 'true', if the item was previously "notFound", check it against the dataset again
                        // If the item was previously "inLibrary", we continue (it's implied by reaching the end of the if statement)
                        if(ref.dataset.zoteroBib == "notFound"){
                            if (zoteroRoam.data.items.find(item => item.key == ref.dataset.linkTitle.replace("@", ""))) {
                                ref.dataset.zoteroBib = "inLibrary";
                                newMatches = newMatches + 1;
                            } else {
                                // Otherwise count it as unmatch
                                newUnmatches = newUnmatches + 1;
                            }
                        }
                    }
                } else {
                    // For items that haven't been checked yet, look for their citekey in the dataset
                    ref.dataset.zoteroBib = (zoteroRoam.data.items.find(item => item.key == ref.dataset.linkTitle.replace("@", ""))) ? "inLibrary" : "notFound";
                    switch(ref.dataset.zoteroBib){
                        case "inLibrary":
                            newMatches += 1;
                            break;
                        case "notFound":
                            newUnmatches += 1;
                    }
                }
            })
            if(newMatches > 0 | newUnmatches > 0){
                console.log(`New matched citekeys: ${newMatches}, New unmatched citekeys: ${newUnmatches}`);
            }
        },

        /** Converts a Roam page reference to a citation alias
         * @param {Element} el - The DOM Element of the page reference */
        convertToCitekey(el){
            let libItem = zoteroRoam.data.items.find(item => item.key == el.innerText.slice(1));
            let currentBlock = el.closest('.roam-block');
            // Find the UID of the ref-citekey's block
            let blockUID = currentBlock.id.slice(-9);
            // Find the index of the ref-citekey within the block
            let refIndex = Array.from(currentBlock.querySelectorAll('.ref-citekey')).findIndex(ref => ref == el.parentNode);

            let blockQuery = window.roamAlphaAPI.q('[:find ?text :in $ ?uid :where[?b :block/uid ?uid][?b :block/string ?text]]', blockUID)[0];
            if(blockQuery.length > 0){
                let contents = blockQuery[0];
                let replacementRegex = new RegExp(`(.*?(?:\\[\\[@.+?\\]\\].*?){${refIndex}})(\\[\\[@.+?\\]\\])(.*)`, 'g');
                let newContents = contents.replace(replacementRegex, (match, pre, refcitekey, post) => `${pre}${zoteroRoam.utils.formatItemReference(libItem, 'citation')}${post}`);
                window.roamAlphaAPI.updateBlock({'block': {'uid': blockUID, 'string': newContents}})
            }

        },

        /** Generates a page menu for each page currently in view
         * @param {number} wait - The duration of the delay to wait before attempting to generate the menu */
        async addPageMenus(wait = 100){
            zoteroRoam.utils.sleep(wait);
            let openPages = Array.from(document.querySelectorAll("h1.rm-title-display"));
            for(const page of openPages) {
                if(page.parentElement.querySelector('.zotero-roam-page-div') || page.parentElement.querySelector('.zotero-roam-page-related')){
                    continue;
                }
                let title = page.querySelector('span') ? page.querySelector('span').innerText : page.innerText;
                if(!zoteroRoam.config.params.pageMenu.trigger(title)){
                    continue;
                }
                // Case 1 (ref-citekey) = make page menu
                if(title.startsWith("@")){
                    let itemCitekey = title.slice(1);
                    let itemInLib = zoteroRoam.data.items.find(it => it.key == itemCitekey);
                    // If the item is in the library
                    if(typeof(itemInLib) !== 'undefined'){
                        zoteroRoam.inPage.renderCitekeyMenu(item = itemInLib, title = title, elem = page);
                    } else {
                        try{
                            page.parentElement.querySelector(".zotero-roam-page-div").remove();
                        } catch(e){};
                    }
                } else if(title.match(/(.+) ([0-9]+).{2}, ([0-9]{4})/g)){
                // Case 2 (DNP) - display items added on that date, if any 
                    let addedOn = zoteroRoam.utils.findSameDay(zoteroRoam.utils.readDNP(title));
                    if(addedOn.length > 0){
                        let itemKeys = addedOn.map(i => i.key);
                        let listDiv = document.createElement('div');
                        listDiv.classList.add('zotero-roam-page-related');
                        listDiv.classList.add('bp3-button-group');
                        listDiv.classList.add('bp3-minimal');
                        listDiv.classList.add('bp3-align-left');
                        listDiv.classList.add('bp3-vertical');
                        listDiv.innerHTML = zoteroRoam.utils.renderBP3Button_group(string = `${addedOn.length} item${addedOn.length > 1 ? "s" : ""} added`, {icon: "calendar", buttonClass: "zotero-roam-page-added-on", buttonAttribute: `data-title="${title}" data-keys=${JSON.stringify(itemKeys)}`});
                        page.parentElement.style.overflow = "auto";
                        page.insertAdjacentElement('afterend', listDiv);
                    }
                } else {
                // Case 3 (all other pages) - display items with matching tags + abstracts
                    let taggedWith = zoteroRoam.data.items.filter(i => i.data.tags && i.data.tags.map(t => t.tag).includes(title));
                    let abstractMentions = zoteroRoam.data.items.filter(i => i.data.abstractNote && i.data.abstractNote.includes(title));
                    if(taggedWith.length > 0 || abstractMentions.length > 0){
                        let listDiv = document.createElement('div');
                        listDiv.classList.add('zotero-roam-page-related');
                        listDiv.classList.add('bp3-button-group');
                        listDiv.classList.add('bp3-minimal');
                        listDiv.classList.add('bp3-align-left');
                        listDiv.classList.add('bp3-vertical');
                        let tagBtn = "";
                        if(taggedWith.length > 0){
                            let itemKeys = taggedWith.map(i => i.key);
                            tagBtn = zoteroRoam.utils.renderBP3Button_group(`${taggedWith.length} tagged item${taggedWith.length > 1 ? "s" : ""}`, {icon: 'manual', buttonClass: "zotero-roam-page-tagged-with", buttonAttribute: `data-title="${title}" data-keys=${JSON.stringify(itemKeys)}`});
                        }
                        let abstractBtn = "";
                        if(abstractMentions.length > 0){
                            let itemKeys = abstractMentions.map(i => i.key);
                            abstractBtn = zoteroRoam.utils.renderBP3Button_group(`${abstractMentions.length} abstract${abstractMentions.length > 1 ? "s" : ""}`, {icon: 'manually-entered-data', buttonClass: "zotero-roam-page-abstract-mentions", buttonAttribute: `data-title="${title}" data-keys=${JSON.stringify(itemKeys)}`});
                        }
                        listDiv.innerHTML = `
                        ${tagBtn}
                        ${abstractBtn}
                        `;
                        page.parentElement.style.overflow = "auto";
                        page.insertAdjacentElement('afterend', listDiv);
                    }
                }
            };
        },

        /** Generates code for a Scite badge
         * @param {string} doi - The DOI for which the badge should be made
         * @param {object} settings - An object containing badge settings 
         * @param {string} settings.layout - Should the badge be horizontal or vertical ?
         * @param {string} settings.showZero - Should the badge include categories that contain no citing paper ?
         * @param {string} settings.showLabels - Should the badge display category labels ?
         * @returns {string} The HTML for the badge */
        makeSciteBadge(doi, {layout = "horizontal", showZero = "true", showLabels = "false"} = {}){
            let sciteBadge = document.createElement("div");
            sciteBadge.classList.add("scite-badge");
            sciteBadge.setAttribute("data-doi", doi);
            sciteBadge.setAttribute("data-layout", layout);
            sciteBadge.setAttribute("data-show-zero", showZero);
            sciteBadge.setAttribute("data-show-labels", showLabels);

            return sciteBadge;
        },

        /** Event delegation for clicks within a page menu
         * @param {Element} target - The DOM Element where the click event happened  */
        async handleClicks(target){
            if(target.closest('.zotero-roam-page-div')){
                let pageDiv = target.closest('.zotero-roam-page-div');
                let title = pageDiv.dataset.title;
                let uid = pageDiv.dataset.uid;
                let btn = target.closest('button');
                if(btn){
                    if(btn.classList.contains('zotero-roam-page-menu-add-metadata')){
                        console.log(`Importing metadata to ${title} (${uid})...`);
                        zoteroRoam.handlers.importItemMetadata(title, uid = uid, {popup: true});
                    } else if(btn.classList.contains('zotero-roam-page-menu-import-notes')){
                        console.log(`Adding notes to ${title} (${uid})...`);
                        zoteroRoam.handlers.addItemNotes(title = title, uid = uid);
                    } else if(btn.classList.contains('zotero-roam-page-menu-view-item-info')){
                        zoteroRoam.interface.renderItemInPanel(citekey = title);
                    } else if(btn.classList.contains('zotero-roam-page-menu-backlinks-button')){
                        // Change caret class & show the backlinks list
                        let caretEl = btn.querySelector(".bp3-icon-caret-down");
                        let backlinksList = btn.parentElement.querySelector(".zotero-roam-page-menu-backlinks-list");

                        if(Array.from(caretEl.classList).includes("rm-caret-closed") && backlinksList){
                            caretEl.classList.replace("rm-caret-closed", "rm-caret-open");
                            backlinksList.style.display = "flex";
                        } else if(Array.from(caretEl.classList).includes("rm-caret-open")){
                            caretEl.classList.replace("rm-caret-open", "rm-caret-closed");
                            backlinksList.style.display = "none";
                        }
                    } else if(btn.classList.contains('zotero-roam-page-menu-backlink-open-sidebar')){
                        zoteroRoam.utils.addToSidebar(uid = btn.dataset.uid);
                    } else if(btn.classList.contains('zotero-roam-page-menu-backlink-add-sidebar')){
                        let elUID = roamAlphaAPI.util.generateUID();
                        roamAlphaAPI.createPage({'page': {'title': btn.dataset.title, 'uid': elUID}});
                        await zoteroRoam.handlers.importItemMetadata(title = btn.dataset.title, uid = elUID, {popup: false});
                        zoteroRoam.utils.addToSidebar(uid = elUID);
                    } else if(btn.classList.contains('zotero-roam-page-menu-backlinks-total')){
                        let doi = btn.getAttribute("data-doi");
                        let citekey = btn.getAttribute("data-citekey");
                        zoteroRoam.interface.popCitationsOverlay(doi, citekey, type = "citations");
                    } else if(btn.classList.contains('zotero-roam-page-menu-references-total')){
                        let doi = btn.getAttribute("data-doi");
                        let citekey = btn.getAttribute("data-citekey");
                        zoteroRoam.interface.popCitationsOverlay(doi, citekey, type = "references");
                    }
                }
            } else if(target.closest('.zotero-roam-page-related')){
                let btn = target.closest('button');
                if(btn){
                    let title = btn.dataset.title;
                    let keys = JSON.parse(btn.dataset.keys);
                    if(btn.classList.contains("zotero-roam-page-added-on")){
                        zoteroRoam.interface.popRelatedDialog(title, keys, type = "added-on");
                    } else if(btn.classList.contains("zotero-roam-page-tagged-with")){
                        zoteroRoam.interface.popRelatedDialog(title, keys, type = "tagged-with");
                    } else if(btn.classList.contains("zotero-roam-page-abstract-mentions")){
                        zoteroRoam.interface.popRelatedDialog(title, keys, type = "abstract-mention");
                    }
                }
            }
        },

        /** Makes a page menu for a ref-citekey header
         * @fires zotero-roam:menu-ready
         * @param {object} item - The Zotero item for which to make the menu 
         * @param {string} title - The title of the Roam page 
         * @param {Element} elem - The DOM Element of the h1.rm-title-display for which the menu is being added 
         */
        async renderCitekeyMenu(item, title, elem){
            let itemCitekey = title.slice(1);
            let itemDOI = !item.data.DOI ? "" : zoteroRoam.utils.parseDOI(item.data.DOI);
            let pageInGraph = zoteroRoam.utils.lookForPage(title);
            let itemChildren = zoteroRoam.formatting.getItemChildren(item, { pdf_as: "raw", notes_as: "raw" });
            // List of default elements to include
            let menu_defaults = zoteroRoam.config.params.pageMenu.defaults;
            // ----
            // Div wrapper
            let pageDiv = elem.parentElement.querySelector('.zotero-roam-page-div');
            if(pageDiv == null){
                pageDiv = document.createElement("div");
                pageDiv.classList.add("zotero-roam-page-div");
                pageDiv.setAttribute("data-uid", pageInGraph.uid);
                pageDiv.setAttribute("data-title", title);
                pageDiv.innerHTML = !itemDOI ? `` :`
                <span class="zotero-roam-page-doi" data-doi="${itemDOI}">
                <a href="https://doi.org/${itemDOI}" class="bp3-text-muted" target="_blank">${itemDOI}</a>
                </span>
                `;
                elem.insertAdjacentElement('afterend', pageDiv);
        
                // ---
                // Page menu
                let menuDiv = elem.parentElement.querySelector('.zotero-roam-page-menu');
                if(menuDiv == null){
                    menuDiv = document.createElement("div");
                    menuDiv.classList.add("zotero-roam-page-menu");
                    menuDiv.classList.add("bp3-card");
                    if(zoteroRoam.config.params.theme){ menuDiv.classList.add(zoteroRoam.config.params.theme) };
                    pageDiv.appendChild(menuDiv);
                }
        
                // Check contents of the menu settings, and create elements accordingly
                let addMetadata_element = !menu_defaults.includes("addMetadata") ? `` : zoteroRoam.utils.renderBP3Button_group(string = "Add metadata", {buttonClass: "bp3-minimal zotero-roam-page-menu-add-metadata", icon: "add"});
                let importNotes_element = !menu_defaults.includes("importNotes") || !itemChildren.notes ? `` : zoteroRoam.utils.renderBP3Button_group(string = "Import notes", {buttonClass: "bp3-minimal zotero-roam-page-menu-import-notes", icon: "comment"});
                let viewItemInfo_element = !menu_defaults.includes("viewItemInfo") ? `` : zoteroRoam.utils.renderBP3Button_group(string = "View item information", {buttonClass: "bp3-minimal zotero-roam-page-menu-view-item-info", icon: "info-sign"});
                let openZoteroLocal_element = !menu_defaults.includes("openZoteroLocal") ? `` : zoteroRoam.utils.renderBP3Button_link(string = "Open in Zotero", {linkClass: "bp3-minimal zotero-roam-page-menu-open-zotero-local", target: zoteroRoam.formatting.getLocalLink(item, {format: "target"}), linkAttribute: `target="_blank"`, icon: "application"});
                let openZoteroWeb_element = !menu_defaults.includes("openZoteroWeb") ? `` : zoteroRoam.utils.renderBP3Button_link(string = "Open in Zotero", {linkClass: "bp3-minimal zotero-roam-page-menu-open-zotero-web", target: zoteroRoam.formatting.getWebLink(item, {format: "target"}), linkAttribute: `target="_blank"`, icon: "cloud"});
        
                // PDF links
                let pdfLinks_element = !menu_defaults.includes("pdfLinks") || !itemChildren.pdfItems ? `` : itemChildren.pdfItems.map(item => {
                        let libLoc = item.library.type == "group" ? `groups/${item.library.id}` : `library`;
                        let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(item.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${item.data.key}` : item.data.url;
                        let pdfTitle = item.data.filename || item.data.title;
                        return zoteroRoam.utils.renderBP3Button_link(string = pdfTitle, {linkClass: "bp3-minimal zotero-roam-page-menu-pdf-link", icon: "paperclip", target: pdfHref, linkAttribute: `target="_blank"` });
                }).join("");
        
                // Web records
                let records_list = [];
                if(menu_defaults.includes("connectedPapers")){ records_list.push(zoteroRoam.utils.renderBP3Button_link(string = "Connected Papers", {icon: "layout", linkClass: "bp3-minimal bp3-intent-primary zotero-roam-page-menu-connected-papers", linkAttribute: `target="_blank"`, target: `https://www.connectedpapers.com/${(!item.data.DOI) ? "search?q=" + encodeURIComponent(item.data.title) : "api/redirect/doi/" + itemDOI}`})) }
                if(menu_defaults.includes("semanticScholar")){ records_list.push((!itemDOI) ? "" : zoteroRoam.utils.renderBP3Button_link(string = "Semantic Scholar", {icon: "bookmark", linkClass: "bp3-minimal bp3-intent-primary zotero-roam-page-menu-semantic-scholar", linkAttribute: `target="_blank"`, target: `https://api.semanticscholar.org/${itemDOI}`})) }
                if(menu_defaults.includes("googleScholar")){ records_list.push(zoteroRoam.utils.renderBP3Button_link(string = "Google Scholar", {icon: "learning", linkClass: "bp3-minimal bp3-intent-primary zotero-roam-page-menu-google-scholar", linkAttribute: `target="_blank"`, target: `https://scholar.google.com/scholar?q=${(!item.data.DOI) ? encodeURIComponent(item.data.title) : itemDOI}`})) }
        
                // Backlinks
                let backlinksLib = "";
                let citeObject = null;
                if(menu_defaults.includes("citingPapers") && itemDOI){
                    citeObject = await zoteroRoam.handlers.getSemantic(itemDOI);
                    if(citeObject.data){
                        let citingDOIs = citeObject.citations.filter(cit => cit.doi).map(cit => cit.doi);
                        let citedDOIs = citeObject.references.filter(ref => ref.doi).map(ref => ref.doi);
                        let allDOIs = [...citingDOIs, ...citedDOIs];
                        if(allDOIs.length > 0){
                            let papersInLib = allDOIs.map(doi => zoteroRoam.data.items.filter(it => it.data.DOI).find(it => zoteroRoam.utils.parseDOI(it.data.DOI).toLowerCase() == doi.toLowerCase())).filter(Boolean);
                            papersInLib.forEach((paper, index) => {
                                let cleanDOI = zoteroRoam.utils.parseDOI(paper.data.DOI);
                                if(zoteroRoam.utils.includes_anycase(citingDOIs, cleanDOI)){
                                    papersInLib[index].type = "citing";
                                } else {
                                    papersInLib[index].type = "cited";
                                }
                            });
                            backlinksLib = "";
                            backlinksLib += zoteroRoam.utils.renderBP3Button_group(string = `${citedDOIs.length > 0 ? citedDOIs.length : "No"} references`, {buttonClass: "bp3-minimal bp3-intent-primary zotero-roam-page-menu-references-total", icon: "citation", buttonAttribute: `data-doi="${itemDOI}" data-citekey="${itemCitekey}" ${citedDOIs.length > 0 ? "" : "disabled"}`});
                            backlinksLib += zoteroRoam.utils.renderBP3Button_group(string = `${citingDOIs.length > 0 ? citingDOIs.length : "No"} citing papers`, {buttonClass: "bp3-minimal bp3-intent-warning zotero-roam-page-menu-backlinks-total", icon: "chat", buttonAttribute: `data-doi="${itemDOI}" data-citekey="${itemCitekey}" ${citingDOIs.length > 0 ? "" : "disabled"}`});
                            backlinksLib += zoteroRoam.utils.renderBP3Button_group(string = `${papersInLib.length > 0 ? papersInLib.length : "No"} related library items`, {buttonClass: `bp3-minimal ${papersInLib.length > 0 ? "" : "bp3-disabled"} zotero-roam-page-menu-backlinks-button`, icon: "caret-down bp3-icon-standard rm-caret rm-caret-closed"});
        
                            if(papersInLib.length > 0){
                                backlinksLib += `
                                <ul class="zotero-roam-page-menu-backlinks-list bp3-list-unstyled bp3-text-small" style="display:none;">
                                ${zoteroRoam.inPage.renderBacklinksList(papersInLib)}
                                </ul>
                                `
                            }
                        }
                    }
                }
        
                menuDiv.innerHTML = `
                <div class="zotero-roam-page-menu-header">
                <div class="zotero-roam-page-menu-actions bp3-button-group">
                ${addMetadata_element}
                ${importNotes_element}
                ${viewItemInfo_element}
                ${openZoteroLocal_element}
                ${openZoteroWeb_element}
                ${pdfLinks_element}
                ${records_list.length == 0 ? "" : records_list.join("\n")}
                </div>
                </div>
                <div class="zotero-roam-page-menu-citations" ${itemDOI ? `data-doi="${itemDOI}"` : ""}>
                ${backlinksLib}
                </div>
                `;
        
                // ---
                // Badge from scite.ai
                if(menu_defaults.includes("sciteBadge")){
                    if(item.data.DOI && elem.parentElement.querySelector(".scite-badge") == null){
                        let sciteBadge = zoteroRoam.inPage.makeSciteBadge(doi = itemDOI);
                        elem.parentElement.querySelector(".zotero-roam-page-menu-header").appendChild(sciteBadge);
                        // Manual trigger to insert badges
                        window.__SCITE.insertBadges();
                    }
                }
        
                /**
                 * @event zoteroRoam:menu-ready
                 * @type {object}
                 * @property {string} title - The item's Roam page title
                 * @property {object} item - The item's Zotero data object
                 * @property {string} doi - The item's DOI
                 * @property {string} uid - The item's Roam page UID
                 * @property {object} children - The item's children
                 * @property {object} semantic - The item's citations data from Semantic Scholar
                 * @property {Element} div - The menu's HTML node
                 * @property {string} context - The context in which the menu was generated (main section or sidebar)
                 */
                 zoteroRoam.events.emit('menu-ready', {
                    title: title,
                    item: item,
                    doi: itemDOI,
                    uid: pageInGraph.uid,
                    children: itemChildren,
                    semantic: citeObject,
                    div: pageDiv,
                    context: pageDiv.closest('.roam-article') ? "main" : "sidebar"
                });
        
            }
        },

        renderBacklinksItem(paper, type, uid = null){
            let icon = type == "reference" ? "citation" : "chat";
            if(uid){
                return `
                <li class="related-item_listed bp3-blockquote" item-type="${type}" data-key="@${paper.key}" in-graph="true">
                <div class="related_info">
                <a href="${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${uid}"><span><span class="bp3-icon bp3-icon-${icon}"></span>${zoteroRoam.utils.formatItemReference(paper, "zettlr_accent")}</span></a>
                </div>
                <div class="related_state">
                ${zoteroRoam.utils.renderBP3Button_group(string = "", {buttonClass: "bp3-minimal zotero-roam-page-menu-backlink-open-sidebar", icon: "inheritance", buttonAttribute: `data-uid="${uid}" title="Open in sidebar"`})}
                </div>
                </li>`;
            } else {
                return `
                <li class="related-item_listed bp3-blockquote" item-type="${type}" data-key="@${paper.key}" in-graph="false">
                <div class="related_info">
                <span><span class="bp3-icon bp3-icon-${icon}"></span>${zoteroRoam.utils.formatItemReference(paper, "zettlr_accent")}</span>
                </div>
                <div class="related_state">
                ${zoteroRoam.utils.renderBP3Button_group(string = "", {buttonClass: "bp3-minimal zotero-roam-page-menu-backlink-add-sidebar", icon: "add", buttonAttribute: `data-title="@${paper.key}" title="Add & open in sidebar"`})}
                </div>
                </li>`
            }
        },

        renderBacklinksList(papers){
            let citationsInLib = papers.filter(p => p.type == "citing");
            let referencesInLib = papers.filter(p => p.type == "cited");
            let referencesList = [];
            let citationsList = [];
            if(referencesInLib.length > 0){
                referencesList = referencesInLib.sort((a,b) => (a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1)).map(paper => {
                    let paperUID = zoteroRoam.utils.lookForPage('@' + paper.key).uid || null;
                    return zoteroRoam.inPage.renderBacklinksItem(paper, "reference", uid = paperUID);
                });
            }
            if(citationsInLib.length > 0){
                citationsList = citationsInLib.sort((a,b) => (a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1)).map(paper => {
                    let paperUID = zoteroRoam.utils.lookForPage('@' + paper.key).uid || null;
                    return zoteroRoam.inPage.renderBacklinksItem(paper, "citation", uid = paperUID);
                });
            }
            let fullLib = [...referencesList, ...citationsList];
            // https://flaviocopes.com/how-to-cut-array-half-javascript/
            let half = Math.ceil(fullLib.length / 2);
            let firstHalf = [];
            let secondHalf = [];
            if(referencesList.length > half){
                firstHalf = referencesList.slice(0, half);
                secondHalf = [...citationsList, ...referencesList.slice(half)];
            } else {
                firstHalf = fullLib.slice(0, half);
                secondHalf = fullLib.slice(half);
            }
            return `
            <ul class="col-1-left bp3-list-unstyled">
            ${firstHalf.join("")}
            </ul>
            <ul class="col-2-right bp3-list-unstyled">
            ${secondHalf.join("")}
            </ul>
            `
        }
    }
})();
