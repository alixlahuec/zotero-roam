
var zoteroRoam = {};

;(()=>{
    
    zoteroRoam = {

        Shortcut: function(obj) {
            this.action = obj.action;
            this.template = {
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false
            }
            this.watcher = {
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false
            }

            for(k in obj.template){
                this.template[`${k}`] = obj.template[`${k}`];
                this.watcher[`${k}`] = false;
            }
            // If the template was empty/all keys in the template are 'false', destroy the template (invalid)
            if(Object.keys(this.template).every(k => this.template[k] === false)){
                this.template = {};
            }
        },

        Pagination: function(obj){
            this.data = obj.data;
            this.itemsPerPage = obj.itemsPerPage || zoteroRoam.config.params.citations.itemsPerPage;
            this.currentPage = 1;
            this.nbPages = Math.ceil(this.data.length / this.itemsPerPage);
            this.startIndex = (this.currentPage - 1)*this.itemsPerPage + 1;

            this.updateStartIndex = function(){
                this.startIndex = (this.currentPage - 1)*this.itemsPerPage + 1;
            }

            this.getCurrentPageData = function(){
                return this.getPageData(this.currentPage);
            }

            this.getPageData = function(n){
                return this.data.slice(start = this.itemsPerPage*(n - 1), end = this.itemsPerPage*n);
            }

            this.previousPage = function(){
                this.currentPage -= 1;
                if(this.currentPage < 1){ this.currentPage = 1};
                this.updateStartIndex();
                zoteroRoam.interface.renderCitationsPagination();
            }

            this.nextPage = function(){
                this.currentPage += 1;
                if(this.currentPage > this.nbPages){ this.currentPage = this.nbPages};
                this.updateStartIndex();
                zoteroRoam.interface.renderCitationsPagination();
            }
        },

        data: {items: [], collections: [], scite: [], libraries: [], keys: []},

        librarySearch: {autocomplete: null},

        citations: {pagination: null, autocomplete: null, currentDOI: ""},

        config: {
            autoComplete: {
                data: {
                    src: async function() {
                        if(zoteroRoam.data.items.length == 0){
                            return [];
                        } else {
                            return zoteroRoam.handlers.simplifyDataArray(zoteroRoam.data.items);
                        }
                    },
                    keys: ['title', 'authorsLastNames', 'year', 'tagsString', 'key', '_multiField'],
                    cache: false,
                    filter: (list) => {
                        // Make sure to return only one result per item in the dataset, by gathering all indices & returning only the first match for that index
                        // Records are sorted alphabetically (by key name) => _multiField should come last
                        const filteredMatches = Array.from(new Set(list.map((item) => item.index))).map((index) => {
                            return list.filter(item => item.index == index).sort((a,b) => {
                                return zoteroRoam.config.autoComplete.data.keys.findIndex(key => key == a.key) < zoteroRoam.config.autoComplete.data.keys.findIndex(key => key == b.key) ? -1 : 1;
                            })[0];
                        });
                        return filteredMatches;
                    }
                },
                selector: '#zotero-roam-search-autocomplete',
                wrapper: false,
                searchEngine: (query, record) => {
                    return zoteroRoam.utils.multiwordMatch(query, record);
                },
                sort: (a, b) => { // Sort by author, alphabetically
                    if(a.value.authors.toLowerCase() < b.value.authors.toLowerCase()) return -1;
                    if(a.value.authors.toLowerCase() > b.value.authors.toLowerCase()) return 1;
                    return 0;
                },
                resultsList: {
                    class: "zotero-roam-search-results-list",
                    id: "zotero-roam-search-results-list",
                    destination: "#zotero-roam-library-search-div",
                    position: "beforeend",
                    maxResults: 100,
                    element: (list, data) => {
                        list.classList.add("bp3-menu");
                    }
                },
                resultItem: {
                    tag: 'li',
                    class: "zotero-roam-search_result",
                    id: "zotero-roam-search_result",
                    element: (item, data) => {
                        let itemMetadata = `<span class="zotero-roam-search-item-metadata"> ${data.value.meta}</span>`;
                        let itemTitleContent = (data.key == "title") ? data.match : data.value.title;
                        let itemTitle = `<span class="zotero-roam-search-item-title" style="display:block;">${itemTitleContent}</span>`;
                        
                        let keyEl = `
                        <span class="bp3-menu-item-label zotero-roam-search-item-key">
                        <a href="zotero://select/library/items/${data.value.itemKey}" destination="zotero">${data.value.key}</a>
                        </span>
                        `;

                        let itemYear = data.value.year ? ` (${data.value.year})` : "";
            
                        // Prepare authors element, if there are any
                        let itemAuthors = "";
                        if(data.value.authors){
                            // If the match is in the full list of authors, manually add the .autoComplete_highlighted class to the abbreviated authors span
                            if(data.key == "authorsLastNames" || data.key == "year"){
                                itemAuthors = `<span class="zotero-roam-search-item-authors autoComplete_highlighted">${data.value.authors}${itemYear}</span>`;
                            } else {
                                itemAuthors = `<span class="zotero-roam-search-item-authors">${zoteroRoam.utils.renderBP3Tag(data.value.authors + itemYear, {modifier: "bp3-intent-primary"})}</span>`;
                            }
                        }
                        // Prepare tags element, if there are any
                        let itemTags = "";
                        if(data.value.tagsString){
                            let itemTagsContent = (data.key == "tagsString") ? data.match : data.value.tagsString;
                            itemTags = `<span class="zotero-roam-search-item-tags" style="display:block;">${itemTagsContent}</span>`;
                        }
            
                        // Render the element's template
                        item.innerHTML = `<div label="${data.value.key}" class="bp3-menu-item bp3-popover-dismiss">
                                            <div class="bp3-text-overflow-ellipsis bp3-fill zotero-roam-search-item-contents">
                                            ${itemTitle}
                                            <span class="zotero-roam-citation-metadata-contents">
                                            ${itemAuthors}${itemMetadata}
                                            ${itemTags}
                                            </span>
                                            </div>
                                            ${keyEl}
                                            </div>`;
              
                    }
                },
                events: {
                    input: {
                        focus: (event) => {
                            zoteroRoam.interface.clearSelectedItem();
                            zoteroRoam.librarySearch.autocomplete.start();
                        },
                        keydown: (event) => {
                            zoteroRoam.interface.clearSelectedItem();
                            zoteroRoam.librarySearch.autocomplete.start();
                        },
                        results: (event) => {
                            if(event.detail.query.length == 0){
                                document.querySelector(".zotero-roam-library-results-count").innerHTML = ``;
                            } else if(event.detail.query.length > 0 && event.detail.results.length == 0){
                                document.querySelector(".zotero-roam-library-results-count").innerHTML = `
                                <strong>No results</strong> for ${event.detail.query}
                                `;
                            }
                        },
                        selection: (event) => {
                            let feedback = event.detail;
                            zoteroRoam.interface.search.input.blur();
                            document.querySelector(".zotero-roam-library-results-count").innerHTML = ``;
                            let quickCopyEnabled = document.querySelector("#zotero-roam-quick-copy-mode").checked;
                            if(zoteroRoam.config.params.always_copy == true || (quickCopyEnabled && !zoteroRoam.config.params.override_quickcopy.overridden)){
                                let clipboard = zoteroRoam.interface.search.overlay.querySelector("input.clipboard-copy-utility");
                                let toCopy = ``;
                                switch(zoteroRoam.config.params.quick_copy_format){
                                    case "citation":
                                        let citationText = `${feedback.selection.value.authors || ""}`;
                                        if(feedback.selection.value.year){ citationText += ` (${feedback.selection.value.year})` };
                                        toCopy = `[${citationText}]([[@${feedback.selection.value.key}]])`;
                                        break;
                                    default:
                                        toCopy = zoteroRoam.utils.formatItemReference(item = feedback.selection.value, format = zoteroRoam.config.params.quick_copy_format);
                                };
                                clipboard.value = toCopy;
                                clipboard.select();
                                document.execCommand("copy");
                                if(quickCopyEnabled && !zoteroRoam.config.params.override_quickcopy.overridden){
                                    zoteroRoam.interface.toggleSearchOverlay("hide");
                                } else {
                                    zoteroRoam.interface.renderItemInPanel('@' + feedback.selection.value.key);
                                }
                            } else {
                                zoteroRoam.interface.renderItemInPanel('@' + feedback.selection.value.key);
                            }
                        }
                    }
                }
            },
            citationsSearch: {
                data: {
                    src: async function(){
                        if(zoteroRoam.citations.currentDOI.length == 0){
                            return [];
                        } else {
                            return zoteroRoam.data.scite.find(it => it.doi == zoteroRoam.citations.currentDOI).simplified;
                        }
                    },
                    keys: ['year', 'title', 'keywords', 'authorsLastNames', 'abstract', 'meta'],
                    filter: (list) => {
                        // Make sure to return only one result per item in the dataset, by gathering all indices & returning only the first match for that index
                        const filteredMatches = Array.from(new Set(list.map((item) => item.index))).map((index) => {
                            return list.filter(item => item.index == index).sort((a,b) => {
                                return zoteroRoam.config.citationsSearch.data.keys.findIndex(key => key == a.key) < zoteroRoam.config.citationsSearch.data.keys.findIndex(key => key == b.key) ? -1 : 1;
                            })[0];
                        });
                        return filteredMatches;
                    }
                },
                selector: '#zotero-roam-citations-autocomplete',
                wrapper: false,
                searchEngine: (query, record) => {
                    return zoteroRoam.utils.multiwordMatch(query, record)
                },
                resultsList: false,
                events: {
                    input: {
                        keydown: (event) => {
                            zoteroRoam.citations.autocomplete.start();
                        },
                        results: (event) => {
                            if(event.detail.results.length > 0){
                                zoteroRoam.citations.pagination = new zoteroRoam.Pagination({data: event.detail.results.map(res => res.value)});
                                zoteroRoam.interface.renderCitationsPagination();
                            } else {
                                if(event.detail.query.length == 0){
                                    zoteroRoam.interface.popCitationsOverlay(doi = zoteroRoam.citations.currentDOI);
                                } else {
                                    let paginationDiv = document.querySelector("#zotero-roam-citations-pagination");
                                    paginationDiv.querySelector(".zotero-roam-citations-results-count").innerHTML = `
                                    <strong>No results</strong> for ${event.detail.query}
                                    `;
                                    zoteroRoam.citations.pagination = new zoteroRoam.Pagination({data: []});
                                    let paginatedList = paginationDiv.querySelector("ul");
                                    paginatedList.innerHTML = ``;
                                }
                            }
                        }
                    }
                }
            },
            // The tribute's `values` property is set when the tribute is attached to the textarea
            // This is to reflect the most up-to-date version of the dataset
            // Otherwise it could be done here, using cb(), but results were piling up when using that instead of being replaced (function was called at every keystroke I think)
            tribute: {
                trigger: '',
                selectClass: 'zotero-roam-tribute-selected',
                containerClass: 'zotero-roam-tribute',
                lookup: 'display',
                menuItemLimit: 15,
                menuItemTemplate: (item) => {
                    return item.original.display;
                },
                requireLeadingSpace: true,
                selectTemplate: (item) => {
                    return item.original.value;
                },
                searchOpts: {
                    skip: true
                },
                values: (text,cb) => {
                    let formattedLib = zoteroRoam.handlers.getLibItems(format = zoteroRoam.config.params.autocomplete.format, display = zoteroRoam.config.params.autocomplete.display);
                    cb(formattedLib.filter(item => item[zoteroRoam.config.tribute.lookup].toLowerCase().includes(text.toLowerCase())));
                }
            },
            params: {
                override_quickcopy: {overridden: false},
                always_copy: false,
                quick_copy_format: 'citekey',
                autocomplete: {
                    enabled: false,
                    format: 'citation',
                    display: 'citekey'
                },
                citations: {
                    itemsPerPage: 20
                },
                notes: {
                    use: "text",
                    split_char: "\n",
                    func: "zoteroRoam.utils.formatItemNotes"
                },
                pageMenu: {
                    defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb",
                            "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"]
                }
            },
            requests: [], // Assigned the processed Array of requests (see handlers.setupUserRequests)
            shortcuts: [], // Assigned the processed Array of zoteroRoam.Shortcut objects (see shortcuts.setup)
            userSettings: {}, // Assigned the value of the zoteroRoam_settings Object defined by the user (see run.js)
            ref_checking: null,
            page_checking: null,
            auto_update: null,
            editingObserver: null
        },

        funcmap: {DEFAULT: "zoteroRoam.formatting.getItemMetadata"},

        typemap: {
            artwork: "Illustration",
            audioRecording: "Recording",
            bill: "Legislation",
            blogPost: "Blog post",
            book: "Book",
            bookSection: "Chapter",
            "case": "Legal case",
            computerProgram: "Data",
            conferencePaper: "Conference paper",
            document: "Document",
            email: "Letter",
            encyclopediaArticle: "Encyclopaedia article",
            film: "Film",
            forumPost: "Forum post",
            hearing: "Hearing",
            instantMessage: "Instant message",
            interview: "Interview",
            journalArticle: "Article",
            letter: "Letter",
            magazineArticle: "Magazine article",
            manuscript: "Manuscript",
            map: "Image",
            newspaperArticle: "Newspaper article",
            patent: "Patent",
            podcast: "Podcast",
            presentation: "Presentation",
            radioBroadcast: "Radio broadcast",
            report: "Report",
            statute: "Legislation",
            thesis: "Thesis",
            tvBroadcast: "TV broadcast",
            videoRecording: "Recording",
            webpage: "Webpage"
        },

        addExtensionCSS(){
            let autoCompleteCSS = document.createElement('style');
            autoCompleteCSS.textContent = `
            .zotero-roam-dialog-overlay .bp3-dialog-container{justify-content:start;}
            .zotero-roam-dialog-overlay .bp3-dialog{margin-left: calc(360px + 2.5%);padding-bottom:0px;}
            .zotero-roam-dialog-overlay .bp3-dialog[side-panel="hidden"]{width:calc(95% - 720px);}
            .zotero-roam-dialog-overlay .bp3-dialog[side-panel="visible"]{width:calc(95% - 360px);}
            .zotero-roam-dialog-overlay .bp3-dialog[side-panel="visible"] .side-panel{flex-basis:360px!important;}
            .zotero-roam-dialog-overlay .bp3-dialog[side-panel="hidden"] .side-panel{flex-basis:0%;}
            .zotero-roam-dialog-overlay .bp3-dialog .side-panel-contents{width:360px;}
            #zotero-roam-portal .bp3-dialog-body{flex-wrap:nowrap;display:flex;margin:0px;}
            #zotero-roam-portal .controls-top{display:flex;width:98.5%;justify-content:flex-end;}
            #zotero-roam-portal .header-content{width:95%;margin: 0 auto;display:flex;}
            #zotero-roam-portal .header-content h5{font-weight:600;display:inline-block;}
            .zotero-roam-search-overlay .header-content h5{color:#137cbd;}
            .zotero-roam-citations-search-overlay .header-content h5{color: #d9822b;}
            #zotero-roam-portal .header-left{flex: 0 1 66%;padding-top:10px;}
            #zotero-roam-portal .header-right{flex: 0 1 34%;}
            #zotero-roam-portal .panel-subtitle{font-size:0.85em;padding-bottom:10px;display:inline-block;font-style:italic;margin-bottom:0px;color:#6d6d6d;}
            #zotero-roam-search-autocomplete{width:100%;margin-bottom:20px;padding: 0px 10px;}
            #zotero-roam-portal .quick-copy-element{margin:10px;font-size:0.9em;font-weight:400;display:inline-block;}
            #zotero-roam-portal .bp3-dialog-footer-actions{margin:10px 2.5%;}
            #zotero-roam-portal .side-panel{background-color:white;transition:0.5s;font-size:0.8em;overflow:auto;border-radius: 0 6px 6px 0;}
            #zotero-roam-portal .side-panel > .side-panel-contents{padding:10px 20px;}
            li.autoComplete_selected{background-color:#e7f3f7;}
            span.autoComplete_highlighted{color:#146cb7;}
            .zotero-roam-citations-search-overlay .main-panel{width:100%;}
            #zotero-roam-citations-pagination > .bp3-button-group{margin:5px 0;}
            .zotero-roam-search-item-title{font-weight:600;}
            .zotero-roam-search-item-tags{font-style:italic;color:#c1c0c0;display:block;}
            .zotero-roam-citation-link{padding: 0 5px;}
            .zotero-roam-citation-link a, .zotero-roam-citation-metadata-contents{font-size:0.85em;}
            .zotero-roam-citations-results-count{padding: 6px 10px;}
            .zotero-roam-citations-search-results-list.bp3-menu{padding:0px;}
            .zotero-roam-citations-search_result{padding:3px;}
            .zotero-roam-citations-search_result[in-library="true"]{background-color:#e9f7e9;}
            .zotero-roam-page-control > span[icon]{margin-right:0px;}
            #zotero-roam-library-rendered, #zotero-roam-citations-pagination {width:95%;margin: 0 auto;}
            #zotero-roam-library-rendered[view="search"] #zotero-roam-search-selected-item{display:none;}
            #zotero-roam-library-rendered[view="item"] #zotero-roam-library-search-div{display:none;}
            .selected-item-header, .selected-item-body{display:flex;justify-content:space-around;}
            .selected-item-header{margin-bottom:20px;}
            .selected-item-body{flex-wrap:wrap;}
            .item-basic-metadata, .item-additional-metadata{flex: 0 1 60%;}
            .item-abstract{font-size:0.8em;padding:15px;background-color: #f5f8fa;}
            .item-pdf-notes{margin-top: 25px;}
            .item-actions-additional{flex: 0 1 95%;margin-top:25px;}
            .item-citekey-section, .item-actions{flex:0 1 30%;}
            .item-actions > .bp3-card{background-color: #eff8ff;box-shadow:none;}
            .item-in-graph{padding: 0 10px;}
            .item-citekey-section{margin:10px 0px; overflow-wrap:break-word;}
            .item-citekey-section .citekey-element{font-weight:bold;padding:0 10px;}
            .item-citekey-section .copy-buttons .bp3-button{font-size:0.7em;flex-wrap:wrap;}
            a.item-go-to-page[disabled]{pointer-events:none;opacity:0.5;}
            span.zotero-roam-sequence{background-color:khaki;padding:3px 6px;border-radius:3px;font-size:0.85em;font-weight:normal;}
            .zotero-roam-tribute {max-width:800px;max-height:300px;overflow:scroll;margin-top:5px;}
            .zotero-roam-tribute ul {list-style-type:none;padding:0px;background-color: white;border:1px #e4e4e4 solid; border-radius:2px;}
            .zotero-roam-tribute ul li {padding: 2px 5px;font-weight:300;}
            .zotero-roam-tribute-selected {background-color: #4f97d4;color:white;}
            .zotero-roam-page-doi{margin:10px;display:block;font-weight:600;letter-spacing:0.3mm;}
            .zotero-roam-page-doi a{color:#c6c6c6;}
            .zotero-roam-page-menu{justify-content:space-between;border:1px #eaeaea solid;padding:10px;border-radius:5px;background-color: #f8f8f9;}
            .zotero-roam-page-menu-header{display:flex;}
            .zotero-roam-page-menu-actions{flex-wrap:wrap;}
            .zotero-roam-page-menu hr{margin:2px 0;}
            .scite-badge{padding-top:5px;min-width:25%;}
            .scite-badge[style*='position: fixed; right: 1%;'] {display: none!important;}
            .zotero-roam-page-menu-pdf-link, .item-pdf-link{font-weight:600;text-align:left!important;}
            .zotero-roam-page-menu-backlinks-list{list-style-type:none;font-size:0.9em;}
            .zotero-roam-page-menu-backlinks-total {font-weight: 700;}
            .zotero-roam-citations-search_result > .bp3-menu-item, .zotero-roam-search_result > .bp3-menu-item {flex-wrap:wrap;justify-content:space-between;}
            .zotero-roam-citations-search_result > .bp3-menu-item:hover{background-color:unset;cursor:unset;}
            .zotero-roam-citation-metadata, .zotero-roam-search-item-contents{flex: 0 2 77%;white-space:normal;}
            .zotero-roam-citation-links-list{display:block;}
            .zotero-roam-search-item-key{flex: 0 1 20%;text-align:right;}
            .zotero-roam-search-item-key .zotero-roam-citation-doi-link {display:block;font-weight:500;}
            .zotero-roam-search-item-key a, .zotero-roam-search-item-key button{font-size:0.8em;overflow-wrap:break-word;}
            .zotero-roam-citation-abstract{font-size:0.88em;font-weight:300;color:black;padding:3px 5px;flex:0 1 100%;background-color:#edf7ff;}
            `;
            document.head.append(autoCompleteCSS);
        }

    };

    // Load the autoComplete JS (if there's a better way, I'm all ears)
    // This should be done early on so that the autoComplete constructor is available & ready
    var ac = document.createElement("script");
    ac.src = "https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.1.5/dist/autoComplete.js";
    ac.type = "text/javascript";
    document.getElementsByTagName("head")[0].appendChild(ac);

    // Load the tribute JS
    if(typeof(window.Tribute) == 'undefined'){
        var trib = document.createElement('script');
        trib.src = "https://cdn.jsdelivr.net/npm/tributejs@5.1.3";
        trib.type = "text/javascript";
        document.getElementsByTagName("head")[0].appendChild(trib);
    }

    // Load JS for scite.ai badge
    var sct = document.createElement("script");
    sct.src = "https://cdn.scite.ai/badge/scite-badge-latest.min.js";
    sct.type = "application/javascript";
    sct.async = true;
    document.getElementsByTagName("head")[0].appendChild(sct);

})();

;(()=>{
    zoteroRoam.utils = {

        addBlock(uid, blockString, order = 0) {
            window.roamAlphaAPI.createBlock({ 'location': { 'parent-uid': uid, 'order': order }, 'block': { 'string': blockString } });
        },

        // From Darren Cook on SO : https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
        // Escape special characters in user input so that RegExp can be generated :
        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        },

        // From Jason Bunting on SO : https://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
        // Execute function by name :
        executeFunctionByName(functionName, context /*, args */) {
            var args = Array.prototype.slice.call(arguments, 2);
            var namespaces = functionName.split(".");
            var func = namespaces.pop();
            for (var i = 0; i < namespaces.length; i++) {
                context = context[namespaces[i]];
            }
            return context[func].apply(context, args);
        },

        findCommonTags(item, {exclude_attachments = true, excluded_tags = [], more_than = 0} = {}){
            let itemTags = item.data.tags.map(t => t.tag.toLowerCase()).filter(t => !excluded_tags.includes(t));
            let haystack = (exclude_attachments == true) ? zoteroRoam.data.items.filter(it => !["attachment", "note", "annotation"].includes(it.data.itemType)) : zoteroRoam.data.items;
            haystack = haystack.filter(it => it.key != item.key);

            return haystack.map(el => {
                let elTags = el.data.tags.map(t => t.tag.toLowerCase());
                let proximity = 0;
                let commons = [];
                elTags.forEach(t => {
                    if(itemTags.includes(t)){
                        proximity +=1;
                        commons.push(t);
                    }
                });

                return{
                    item: el,
                    proximity: proximity,
                    commons: commons
                };
            }).filter(x => x.proximity > more_than);
        },

        findSameDay(item, {exclude_attachments = true} = {}){
            let fullArray = zoteroRoam.data.items.filter(it => new Date(it.data.dateAdded).toDateString() == new Date(item.data.dateAdded).toDateString());
            if(fullArray.length == 0){
                return [];
            } else if(exclude_attachments == true){
                return fullArray.filter(it => it.data.itemType != "attachment");
            } else {
                return fullArray;
            }
        },

        // Process the XHTML bibliography into a Roam format
        // TODO: Explore whether there are other potential tags or styles to convert, besides italics
        formatBib(bib){
            // Grab only the string (strip outer divs)
            let bibString = bib.match("csl-entry\">(.+)</div>")[1];
            // Use a textarea element to decode HTML
            let formatter = document.createElement("textarea");
            formatter.innerHTML = bibString;
            let formattedBib = formatter.innerText;
            // Convert italics
            formattedBib = formattedBib.replaceAll(/<\/?i>/g, "__");
            // Convert links
            let linkRegex = /<a href="(.+)">(.+)<\/a>/g;
            formattedBib = formattedBib.replaceAll(linkRegex, `[$2]($1)`);
        
            return formattedBib;
        },

        splitNotes(arr, split_char = zoteroRoam.config.params.notes["split_char"]){
            if(arr.length == 0){
                return false;
            } else {
                return arr.map(n => n.data.note.split(split_char));
            }
        },

        formatItemNotes(notes){
            return notes.flat(1).map(b => zoteroRoam.utils.parseNoteBlock(b)).filter(b => b.trim());
        },

        formatItemReference(item, format){
            switch(format){
                case 'tag':
                    return `#[[@${item.key}]]`;
                case 'pageref':
                    return `[[@${item.key}]]`;
                case 'citation':
                    let citeText = item.meta.creatorSummary || ``;
                    citeText = item.meta.parsedDate ? `${citeText} (${new Date(item.meta.parsedDate).getUTCFullYear()})` : citeText;
                    citeText = `[${(citeText.length > 0) ? citeText : item.key}]([[@${item.key}]])`
                    return citeText;
                case 'popover':
                    let popText = item.meta.creatorSummary || ``;
                    popText = item.meta.parsedDate ? `${popText} (${new Date(item.meta.parsedDate).getUTCFullYear()})` : popText;
                    popText = `{{=: ${(popText.length > 0) ? popText : item.key} | {{embed: [[@${item.key}]]}} }}`
                    return popText;
                case 'zettlr':
                    return (item.meta.creatorSummary || ``) + (item.meta.parsedDate ? ` (${new Date(item.meta.parsedDate).getUTCFullYear()})` : ``) + ` : ` + item.data.title;
                case 'zettlr_accent':
                    let accented = `<strong>` + (item.meta.creatorSummary || ``) + (item.meta.parsedDate ? ` (${new Date(item.meta.parsedDate).getUTCFullYear()})` : ``) + `</strong>`;
                    return accented + ` : ` + item.data.title;
                case 'citekey':
                default:
                    return `@${item.key}`;
            }
        },

        getAllPageUIDs(){
            return roamAlphaAPI.q('[:find ?pt ?pu :where[?p :block/uid ?pu][?p :node/title ?pt]]');
        },

        getItemPrefix(item){
            let itemRequest = zoteroRoam.config.requests.find(c => c.name == item.requestLabel);
            return itemRequest.dataURI.match(/(users|groups)\/(.+?)\//g)[0].slice(0,-1);
        },

        // This grabs the block UID and text of the top-child of a parent element, given the parent's UID
        // Note: The case where the parent doesn't have children isn't handled here. It shouldn't be a problem because the context in which it is called is that of looking to add grandchildren blocks, essentially
        // I.e this only gets called if the block with UID equal to parent_uid has a child that also has a child/children
        getTopBlockData(parent_uid) {
            // Look for the UID and string contents of the top-child of a parent
            let top_block = window.roamAlphaAPI.q('[:find ?bUID ?bText :in $ ?pUID :where[?b :block/uid ?bUID][?b :block/string ?bText][?b :block/order 0][?p :block/children ?b][?p :block/uid ?pUID]]', parent_uid);
            if (typeof (top_block) === 'undefined' || top_block == null || top_block.length == 0) {
                // If there were no results or a problem with the results, return false
                // This will keep the loop in waitForBlockUID() going
                // Though if there's a systematic error it won't go on infinitely because waitForBlockUID() will eventually throw an error
                return false;
            } else {
                // If the search returned a block's info, return it for matching
                // If there's any problem with the values returned, make sure to catch any error
                try {
                    let top_block_data = {
                        uid: top_block[0][0],
                        text: top_block[0][1]
                    }
                    return top_block_data;
                } catch(e) {
                    console.error(e);
                }
            }
        },

        lookForPage(title){
            let pageInfo = null;
            let pageSearch = window.roamAlphaAPI.q('[:find ?uid :in $ ?title :where[?p :block/uid ?uid][?p :node/title ?title]]', title);
            if(pageSearch.length > 0){
                pageInfo = {
                    present: true,
                    uid: pageSearch[0][0]
                }
            } else{
                pageInfo = {
                    present: false
                }
            }
            return pageInfo;
        },

        makeDNP(date, {brackets = true} = {}){
            if(date.constructor !== Date){ date = new Date(date); };
            let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            let dateString = `${months[date.getMonth()]} ${zoteroRoam.utils.makeOrdinal(date.getDate())}, ${date.getFullYear()}`;
            if(brackets){
                return `[[${dateString}]]`;
            } else{
                return dateString;
            }
        },

        makeMetaString(item){
            let meta = "";
            let pubInfo = [item.data.publicationTitle, item.data.university, item.data.bookTitle].filter(Boolean);
            if(pubInfo.length > 0){
                meta += `, ${pubInfo[0]}`;
            }
            if(item.data.publisher){
                meta += `, ${item.data.publisher}`;
                if(item.data.place){
                    meta += `: ${item.data.place}`;
                }
            };
            if(item.data.volume){
                meta += `, ${item.data.volume}`;
                if(item.data.issue){
                    meta += `(${item.data.issue})`;
                }
            }
            meta = (item.data.pages) ? (meta + `, ${item.data.pages}.`) : ".";

            return meta;
        },

        makeOrdinal(i) {
            let j = i % 10;
            if (j == 1 & i != 11) {
                return i + "st";
            } else if (j == 2 & i != 12) {
                return i + "nd";
            } else if (j == 3 & i != 13) {
                return i + "rd";
            } else {
                return i + "th";
            }
        },

        makeLinkToPDF(item){
            let libLoc = item.library.type == "group" ? `groups/${item.library.id}` : `library`;
            return (["linked_file", "imported_file", "imported_url"].includes(item.data.linkMode) ? `[${item.data.filename || item.data.title}](zotero://open-pdf/${libLoc}/items/${item.data.key})` : `[${item.data.title}](${item.data.url})`);
        },

        // Given an Array of PDF items, returns an Array of Markdown-style links. If a PDF is a `linked_file` or `imported_file`, make a local Zotero open link / else, make a link to the URL
        makePDFLinks(elem){
            if(elem.constructor === Array && elem.length > 0){
                return elem.map(it => {return zoteroRoam.utils.makeLinkToPDF(it)});
            } else if(elem.constructor === Object){
                return zoteroRoam.utils.makeLinkToPDF(elem);    
            } else{
                return false;
            }
        },

        multiwordMatch(query, string){
            let terms = query.toLowerCase().split(" ");
            let target = string.toLowerCase();
        
            let match = false;
            for(let i = 0; i < terms.length; i++){
                if(target.includes(terms[i])){
                    match = true;
                    target = target.replace(terms[i], "");
                } else{
                    match = false;
                    break;
                }
            }
        
            if(match){ return string };
        
        },
        
        addToSidebar(uid, type = "outline"){
            window.roamAlphaAPI.ui.rightSidebar.addWindow({window:{'type': type, 'block-uid': uid}});
        },

        parseDOI(doi){
            // Clean up the DOI format if needed, to extract prefix + suffix only
            let cleanDOI = (doi.startsWith("10")) ? doi : doi.match(/10\.([0-9]+?)\/(.+)/g)[0];
            return cleanDOI;
        },

        parseNoteBlock(block){
            let cleanBlock = block;
            let formattingSpecs = {
                "</p>": "",
                "</div>": "",
                "<blockquote>": "> ",
                "</blockquote>": "",
                "<strong>": "**",
                "</strong>": "**",
                "<em>": "__",
                "</em>": "__",
                "<b>": "**",
                "</b>": "**",
                "<br />": "\n",
                "<br>": "\n",
                "<u>": "",
                "</u>": ""
            }
            for(prop in formattingSpecs){
                cleanBlock = cleanBlock.replaceAll(`${prop}`, `${formattingSpecs[prop]}`);
            }

            // HTML tags that might have attributes : p, div, span, headers
            let richTags = ["p", "div", "span", "h1", "h2", "h3"];
            richTags.forEach(tag => {
                let tagRegex = new RegExp(`<${tag}>|<${tag} .+?>`, "g"); // Covers both the simple case : <tag>, and the case with modifiers : <tag :modifier>
                cleanBlock = cleanBlock.replaceAll(tagRegex, "");
            })

            let linkRegex = /<a href="(.+?)">(.+?)<\/a>/g;
            cleanBlock = cleanBlock.replaceAll(linkRegex, `[$2]($1)`);

            cleanBlock = zoteroRoam.utils.cleanNewlines(cleanBlock);
        
            return cleanBlock;
        },

        cleanNewlines(text){
            let cleanText = text;
            if(cleanText.startsWith("\n")){
                cleanText = cleanText.slice(1);
                cleanText = zoteroRoam.utils.cleanNewlines(cleanText);
            } else if(cleanText.endsWith("\n")){
                cleanText = cleanText.slice(0, -1);
                cleanText = zoteroRoam.utils.cleanNewlines(cleanText);
            }

            return cleanText;
        },

        renderBP3Button_link(string, {linkClass = "", icon = "", iconModifier = "", target = "", linkAttribute = ""} = {}){
            let iconEl = icon ? `<span icon="${icon}" class="bp3-icon bp3-icon-${icon} ${iconModifier}"></span>` : "";
            return `
            <a class="bp3-button ${linkClass}" href="${target}" ${linkAttribute}>
            ${iconEl}
            <span class="bp3-button-text">${string}</span>
            </a>
            `;
        },

        renderBP3Button_group(string, {buttonClass = "", icon = "", modifier = "", buttonAttribute = ""} = {}){
            let iconEl = icon ? `<span icon="${icon}" class="bp3-icon bp3-icon-${icon} ${modifier}"></span>` : "";
            return `
            <button type="button" class="bp3-button ${buttonClass}" ${buttonAttribute}>
            ${iconEl}
            <span class="bp3-button-text">${string}</span>
            </button>
            `;
        },

        renderBP3ButtonGroup(string, {divClass = "bp3-minimal bp3-fill bp3-align-left", buttonClass = "", modifier = "", icon = "", buttonModifier = ""} = {}){
            return `<div class="bp3-button-group ${divClass}">
                        ${zoteroRoam.utils.renderBP3Button_group(string = string, {buttonClass: buttonClass, icon: icon, modifier: modifier, buttonAttribute: buttonModifier})}
                    </div>`;
        },
        
        renderBP3Tag(string, {modifier = "", icon = "", tagRemove = false} = {}){
            let tagRem = tagRemove ? `<button class="bp3-tag-remove"></button>` : "";
            if(icon.length > 0){
                return `<span class="bp3-tag bp3-minimal ${modifier}"><span icon="${icon}" class="bp3-icon bp3-icon-${icon}"></span><span class="bp3-text-overflow-ellipsis bp3-fill">${string}</span>${tagRem}</span>`;
            } else {
                return `<span class="bp3-tag bp3-minimal ${modifier}" style="margin:5px;">${string}${tagRem}</span>`;
            }
        },

        renderBP3Toast(string, {toastClass = "", style = "opacity:0;top:20px;transition: opacity 0.3s ease-out, top 0.3s ease-in;"} = {}){
            return `
            <div class="bp3-toast ${toastClass} bp3-overlay-content" tabindex="0" style="${style}">
            <span class="bp3-toast-message">${string}</span>
            </div>
            `
        },

        renderHTMLBlockObject(object){
            let objectHTML = "";
            // If the Object doesn't have a string property, throw an error
            if(typeof(object.string) === 'undefined'){
                console.log(object);
                throw new Error('All blocks passed as an Object must have a string property');
            } else {
                // Otherwise add the opening <li>
                objectHTML = objectHTML + `<li>${object.string}`;
                // If the Object has a `children` property
                if(typeof(object.children) !== 'undefined'){
                    if(object.children.length > 0){
                        objectHTML = objectHTML + zoteroRoam.utils.renderHTMLMetadataArray(object.children);
                    }
                }
                objectHTML = objectHTML + ` </li>`;
            }
            return objectHTML;
        },

        renderHTMLMetadataArray(arr){
            let renderedHTML = `<ul>`;
            arr.forEach(el =>{
                // If the element is an Object, pass it to renderHTMLBlockObject to recursively process its contents
                if(el.constructor === Object){
                    renderedHTML = renderedHTML + zoteroRoam.utils.renderHTMLBlockObject(el);
                } else if(el.constructor === String) {
                    // If the element is a simple String, add the corresponding <li> & move on
                    renderedHTML = renderedHTML + `<li>${el} </li>`;
                } else {
                    // If the element is of any other type, throw an error
                    console.log(el);
                    throw new Error('All array items should be of type String or Object');
                }
            });
            renderedHTML = renderedHTML + `</ul>`;
            return renderedHTML;
        },

        renderPageReference(title, uid){
            return `<span data-link-title="${title}" data-link-uid="${uid}">
            <span tabindex="-1" class="rm-page-ref rm-page-ref--link">${title}</span></span>`;
        },

        renderPageTag(title){
            return `<span tabindex="-1" data-tag="${title}" class="rm-page-ref rm-page-ref--tag">#${title}</span>`;
        },

        // From @aweary : https://github.com/facebook/react/issues/11095
        // Leaving in case I want to use it at some point in the future, but currently not in use
        setNativeValue(element, value) {
            const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
            const prototype = Object.getPrototypeOf(element);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
            
            if (valueSetter && valueSetter !== prototypeValueSetter) {
                valueSetter.call(element, value);
            } else {
                prototypeValueSetter.call(element, value);
            }
        },

        // From James Hibbard : https://www.sitepoint.com/delay-sleep-pause-wait/
        // This is the basis for the async/await structure, which is needed to make sure processing is sequential and never parallel
        sleep(ms){
            return new Promise(resolve => setTimeout(resolve, ms));
        }

    };
})();

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

        async addSearchResult(title, uid, {popup = true} = {}){
            let citekey = title.replace("@", "");
            let item = zoteroRoam.data.items.find(i => i.key == citekey);
            let itemData = await zoteroRoam.handlers.formatData(item);
            let outcome = {};
        
            if(item && itemData.length > 0){
                let pageUID = uid || "";
                if(uid) {
                    outcome = await zoteroRoam.handlers.addMetadataArray(page_uid = uid, arr = itemData);
                } else {
                    window.roamAlphaAPI.createPage({'page': {'title': title}});
                    pageUID = await zoteroRoam.handlers.waitForPageUID(title);
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
                                goToPageButton.setAttribute("href", `https://roamresearch.com/${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${pageUID}`);
                                goToPageButton.removeAttribute("disabled");
                            }
                        } catch(e){};
                        await zoteroRoam.utils.sleep(125);
                    } else {
                        let errorMsg = `There was a problem in obtaining the page's UID for ${title}.`;
                        if(popup == true){
                            zoteroRoam.interface.popToast(errorMsg, "danger");
                        } else{
                            console.log(errorMsg);
                        }
                    }
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
        },

        async addItemNotes(title, uid, {popup = true} = {}){
            let citekey = title.startsWith("@") ? title.slice(1) : title;
            let item = zoteroRoam.data.items.find(i => i.key == citekey);

            try {
                let itemNotes = zoteroRoam.formatting.getItemChildren(item, {pdf_as: "raw", notes_as: "formatted", split_char = zoteroRoam.config.params.notes["split_char"] }).notes;
                let outcome = {};

                let pageUID = uid || "";
                if(uid){
                    outcome = await zoteroRoam.handlers.addMetadataArray(page_uid = uid, arr = itemNotes);
                } else {
                    window.roamAlphaAPI.createPage({'page': {'title': title}});
                    pageUID = await zoteroRoam.handlers.waitForPageUID(title);

                    if(pageUID != null){
                        outcome = await zoteroRoam.handlers.addMetadataArray(page_uid = pageUID, arr = itemNotes);
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
                        let errorMsg = `There was a problem in obtaining the page's UID for ${title}.`;
                        if(popup == true){
                            zoteroRoam.interface.popToast(errorMsg, "danger");
                        } else{
                            console.log(errorMsg);
                        }
                    }
                }

                let outcomeMsg = outcome.success ? "Notes successfully imported." : "The notes couldn't be imported.";
                let outcomeIntent = outcome.success ? "success" : "danger";
                if(popup == true){
                    zoteroRoam.interface.popToast(outcomeMsg, outcomeIntent);
                } else {
                    console.log(outcomeMsg);
                }

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
                zoteroRoam.data.libraries = libList.map(lib => { return {prefix: lib, version: 0} });
                zoteroRoam.config.requests = requests;
            }
        },

        async checkForScitations(refSpan){
            try {
                let citekey = refSpan.parentElement.dataset.linkTitle.replace("@", ""); // I'll deal with tags later, or not at all
                let item = zoteroRoam.data.items.find(i => { return i.key == citekey });
                if (item) {
                    if(item.data.DOI){
                        let scitations = await zoteroRoam.handlers.requestScitations(item.data.DOI);
                        if(scitations.simplified.length == 0){
                            zoteroRoam.interface.popToast("This item has no available citing papers");
                        } else {
                            zoteroRoam.interface.popCitationsOverlay(item.data.DOI);
                        }
                    } else{
                        zoteroRoam.interface.popToast("This item has no DOI (required for citations lookup).", "danger");
                    }
                }
            } catch (e) {
                console.error(e);
            }
        },

        async requestCitoid(query, { format = "zotero", has_relation = false, tag_with = []} = {}){
            let results = false;
            try{
                let dataReq = await fetch(`https://en.wikipedia.org/api/rest_v1/data/citation/${format}/${encodeURIComponent(query)}`,{ method: 'GET' });
                if(dataReq.ok == true){
                    let dataRes = await dataReq.json();
                    if(dataRes.length > 0){
                        var {key, version, ...item} = dataRes[0];
                        item.collections = [];
                        item.relations = {};
                        if(has_relation != false){
                            item.relations["dc_relation"] = `http://zotero.org/${zoteroRoam.utils.getItemPrefix(has_relation)}/items/${has_relation.data.key}`;
                        }
                        if(tag_with.length > 0){
                            if(tag_with.constructor === Array){
                                tag_with.forEach(t => item.tags.push({tag: t}));
                            } else if(tag_with.constructor === String){
                                item.tags.push({tag: tag_with});
                            } else {
                                console.log(`Unsupported tag input : ${tag_with}`);
                            }
                        }
                        results = item;
                    }
                } else {
                    console.log(`The request for ${dataReq.url} returned a code of ${dataReq.status}`);
                }
            } catch(e){
                console.error(e);
                zoteroRoam.interface.popToast("The extension encountered an error while accessing citation data. Please check the console for details.", "danger");
            } finally {
                return {
                    data: results
                }
            }
        },

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

        async requestData(requests) {
            let dataCalls = [];
            let collectionsCalls = [];
            if(requests.length == 0){
                throw new Error("No data requests were added to the config object - check for upstream problems");
            }
            try{
                requests.forEach( rq => {
                    dataCalls.push(zoteroRoam.handlers.fetchData(apiKey = rq.apikey, dataURI = rq.dataURI, params = rq.params));
                    collectionsCalls.push(fetch(`https://api.zotero.org/${rq.library}/collections`, {
                        method: 'GET',
                        headers: {
                            'Zotero-API-Version': 3,
                            'Zotero-API-Key': rq.apikey
                        }
                    }));
                });
                // Items data
                let requestsResults = await Promise.all(dataCalls);
                requestsResults = requestsResults.map( (res, i) => res.data.map(item => { 
                        item.requestLabel = requests[i].name; 
                        item.requestIndex = i; 
                        return item;
                    })).flat(1);
                requestsResults = zoteroRoam.handlers.extractCitekeys(requestsResults);
                // Collections data
                let collectionsResults = await Promise.all(collectionsCalls);
                collectionsResults = await Promise.all(collectionsResults.map( (cl, i) => {
                    let latestVersion = cl.headers.get('Last-Modified-Version');
                    let libIndex = zoteroRoam.data.libraries.findIndex(lib => lib.prefix == requests[i].library);
                    if(latestVersion > zoteroRoam.data.libraries[libIndex].version){ zoteroRoam.data.libraries[libIndex].version = latestVersion };

                    return cl.json();
                }));
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
                console.log({
                    dataCalls: dataCalls,
                    collectionsCalls: collectionsCalls
                })
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
                    itemKey: item.data.key,
                    title: `${item.data.title || ""}`,
                    abstract: `${item.data.abstractNote || ""}`,
                    authors: `${item.meta.creatorSummary || ""}`,
                    year: `${(item.meta.parsedDate) ? (new Date(item.meta.parsedDate)).getUTCFullYear().toString() : ""}`,
                    meta: `${zoteroRoam.utils.makeMetaString(item)}`,
                    tags: item.data.tags.map(t => t.tag),
                    authorsFull: item.data.creators.map(c => {return (c.name) ? c.name : [c.firstName, c.lastName].filter(Boolean).join(" ")}),
                    authorsRoles: item.data.creators.map(c => c.creatorType),
                    authorsLastNames: item.data.creators.map(c => c.lastName),
                    tagsString: item.data.tags.map(i => `#${i.tag}`).join(", ")
                }

                simplifiedItem["_multiField"] = simplifiedItem.authorsLastNames + " " + simplifiedItem.year + " " + simplifiedItem.title + " " + simplifiedItem.tagsString;
        
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
                        links: {
                            scite: `https://scite.ai/reports/${cit.slug}`
                        },
                        title: cit.title,
                        year: cit.year || "",
                        meta: ""
                    };
                    let authors = cit.authors.length > 0 ? cit.authors.map(auth => auth.family) : [];
                    simplifiedCitation.authorsLastNames = cit.authors.length > 0 ? cit.authors.map(auth => auth.family) : [];
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
            data = (data.constructor === Array) ? data : [data];
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
                    let libIndex = zoteroRoam.data.libraries.findIndex(lib => lib.prefix == library.prefix);
                    zoteroRoam.data.libraries[libIndex].version = req.headers.get('Last-Modified-Version');
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
;(()=>{
    zoteroRoam.interface = {
        icon: null,
        portal: {div: null, id: "zotero-roam-portal"},
        contextMenu: {
            div: null,
            class: "zotero-roam-context-menu",
            overlay: {div: null, class: "zotero-roam-context-overlay"},
            options: {list: [], class: "zotero-roam-context-menu-option", labels: ["Import Zotero data to page", "Convert to citation", "Check for citing papers", "View item information"]},
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
            class: "zotero-roam-icon-context-menu",
            overlay: {div: null, class: "zotero-roam-icon-context-overlay"},
            options: {list: [], class: "zotero-roam-icon-context-menu-option", labels: ["Update Zotero data", "Search in dataset..."]},
            visible: false,
            position({top, left}){
                zoteroRoam.interface.iconContextMenu.div.style.left = (left >= 0.9*window.innerWidth) ? `calc(${left}px - 10%)` : `${left}px`;
                zoteroRoam.interface.iconContextMenu.div.style.top = `calc(${top}px + 3%)`;
                zoteroRoam.interface.toggleContextOverlay("iconContextMenu", "show");
            }
        },
        citations: {overlay: null, input: null, closeButton: null, overlayClass: "zotero-roam-citations-search"},
        search: {overlay: null, input: null, selectedItemDiv: null, closeButton: null, updateButton: null, overlayClass: "zotero-roam-search"},
        tributeTrigger: ``,
        tributeBlockTrigger: null,
        tributeNewText: ``,

        create(){
            zoteroRoam.interface.createIcon(id = "zotero-roam-icon");
            zoteroRoam.interface.portal.div = zoteroRoam.interface.createPortal(id = zoteroRoam.interface.portal.id);
            zoteroRoam.interface.createContextMenu(elementKey = "contextMenu");
            zoteroRoam.interface.createContextMenu(elementKey = "iconContextMenu");
            // Create search overlay
            zoteroRoam.interface.createOverlay(divClass = zoteroRoam.interface.search.overlayClass);
            zoteroRoam.interface.fillSearchOverlay();
            // Create citations search overlay
            zoteroRoam.interface.createOverlay(divClass = zoteroRoam.interface.citations.overlayClass);
            zoteroRoam.interface.fillCitationsOverlay();
            // Create toast overlay
            zoteroRoam.interface.createToastOverlay();
        },

        setup(){
            zoteroRoam.interface.icon.addEventListener("click", zoteroRoam.extension.toggle);

            zoteroRoam.interface.setupContextMenus(["contextMenu", "iconContextMenu"]);

            zoteroRoam.interface.search.updateButton.addEventListener("click", function(){zoteroRoam.extension.update(popup = true)});
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

        createToastOverlay(){
            let overlay = document.createElement('div');
            overlay.classList.add("bp3-overlay");
            overlay.classList.add("bp3-overlay-open");
            overlay.classList.add("bp3-toast-container");
            overlay.classList.add("bp3-toast-container-top");
            overlay.classList.add("bp3-toast-container-in-portal");
            overlay.classList.add("zotero-roam-toast-overlay");
            
            zoteroRoam.interface.portal.div.appendChild(overlay);
        },

        async popToast(message, intent = "primary"){
            let toastOverlay = zoteroRoam.interface.portal.div.querySelector('.zotero-roam-toast-overlay');
            toastOverlay.innerHTML = zoteroRoam.utils.renderBP3Toast(string = message, {toastClass: `bp3-intent-${intent}`});

            toastOverlay.querySelector('.bp3-toast').style.opacity = "1";
            await zoteroRoam.utils.sleep(700);
            toastOverlay.querySelector('.bp3-toast').style.top = "-100px";

        },

        createOverlay(divClass, dialogCSS = "align-self:baseline;transition:0.5s;", useBackdrop = true){
            try{ document.querySelector(`.${divClass}-overlay`).remove() } catch(e){};

            let overlay = document.createElement("div");
            overlay.classList.add("bp3-overlay");
            overlay.classList.add("bp3-overlay-open");
            overlay.classList.add("bp3-overlay-scroll-container");
            overlay.classList.add(`${divClass}-overlay`);
            overlay.classList.add(`zotero-roam-dialog-overlay`);
            overlay.setAttribute("overlay-visible", "false");
            overlay.style = "display:none;"
            
            if(useBackdrop){
                let overlayBackdrop = document.createElement("div");
                overlayBackdrop.classList.add("bp3-overlay-backdrop");
                overlayBackdrop.classList.add("bp3-overlay-appear-done");
                overlayBackdrop.classList.add("bp3-overlay-enter-done");
                overlayBackdrop.classList.add(`${divClass}-backdrop`);
                overlayBackdrop.tabIndex = "0";
                overlay.appendChild(overlayBackdrop);
            }
        
            let dialogContainer = document.createElement("div");
            dialogContainer.classList.add("bp3-dialog-container");
            dialogContainer.classList.add("bp3-overlay-content");
            dialogContainer.classList.add("bp3-overlay-appear-done");
            dialogContainer.classList.add("bp3-overlay-enter-done");
            dialogContainer.tabIndex = "0";
        
            let dialogDiv = document.createElement("div");
            dialogDiv.classList.add("bp3-dialog");
            dialogDiv.setAttribute("side-panel", "hidden");
            dialogDiv.style = dialogCSS;
            
            let dialogBody = document.createElement("div");
            dialogBody.classList.add("bp3-dialog-body");

            let dialogMainPanel = document.createElement('div');
            dialogMainPanel.classList.add("main-panel");
            dialogMainPanel.style = `flex: 1 1 100%;`;

            let dialogSidePanel = document.createElement('div');
            dialogSidePanel.classList.add("side-panel");
            dialogSidePanel.style = `flex: 1 0 0%;`;

            let sidePanelContents = document.createElement('div');
            sidePanelContents.classList.add("side-panel-contents");
            dialogSidePanel.appendChild(sidePanelContents);
        
            // Chain up all the DOM elements
            dialogBody.appendChild(dialogMainPanel);
            dialogBody.appendChild(dialogSidePanel);
            dialogDiv.appendChild(dialogBody);
        
            dialogContainer.appendChild(dialogDiv);
        
            overlay.appendChild(dialogContainer);
        
            zoteroRoam.interface.portal.div.appendChild(overlay);

        },

        fillSearchOverlay(divClass = zoteroRoam.interface.search.overlayClass){
            let dialogMainPanel = document.querySelector(`.${divClass}-overlay .bp3-dialog-body .main-panel`);

            let headerContent = document.createElement('div');
            headerContent.classList.add("bp3-input-group");
            headerContent.classList.add("header-content");

            // Header (left)

            let headerLeft = document.createElement('div');
            headerLeft.classList.add("header-left");

            let panelTitle = document.createElement('h5');
            panelTitle.innerText = "Zotero Library";

            let panelSubtitle = document.createElement('p');
            panelSubtitle.classList.add("bp3-text");
            panelSubtitle.classList.add("panel-subtitle");
            panelSubtitle.innerText = `Search by title, year, authors (last names), citekey, tags`;
        
            let searchBar = document.createElement('input');
            searchBar.id = "zotero-roam-search-autocomplete";
            searchBar.tabIndex = "1";
            searchBar.type = "text";
            searchBar.classList.add("bp3-input");
            searchBar.classList.add("bp3-intent-primary");

            headerLeft.appendChild(panelTitle);
            headerLeft.appendChild(panelSubtitle);
            headerLeft.appendChild(searchBar);

            // Header (right)

            let headerRight = document.createElement('div');
            headerRight.classList.add("header-right");

            let controlsTop = document.createElement('div');
            controlsTop.classList.add("controls-top");
            controlsTop.innerHTML = `
            <button type="button" aria-label="Close" class="zotero-roam-search-close bp3-button bp3-minimal bp3-dialog-close-button">
            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>
            `;

            let quickCopyElement = document.createElement('label');
            quickCopyElement.classList.add("bp3-control");
            quickCopyElement.classList.add("bp3-switch");
            quickCopyElement.classList.add("quick-copy-element");

            let quickCopyInput = document.createElement('input');
            quickCopyInput.id = "zotero-roam-quick-copy-mode";
            quickCopyInput.setAttribute("type", "checkbox");
            quickCopyElement.appendChild(quickCopyInput);

            let quickCopyIndicator = document.createElement('span');
            quickCopyIndicator.classList.add("bp3-control-indicator");
            quickCopyElement.appendChild(quickCopyIndicator);

            quickCopyElement.innerHTML += `Quick Copy`;

            headerRight.appendChild(controlsTop);
            headerRight.appendChild(quickCopyElement);

            // ---
            
            headerContent.appendChild(headerLeft);
            headerContent.appendChild(headerRight);

            dialogMainPanel.appendChild(headerContent);

            // ---

            let renderedDiv = document.createElement('div');
            renderedDiv.id = "zotero-roam-library-rendered";
            renderedDiv.setAttribute("view", "search");

            let librarySearchDiv = document.createElement('div');
            librarySearchDiv.id = "zotero-roam-library-search-div";

            let searchPaginationDiv = document.createElement('div');
            searchPaginationDiv.classList.add("bp3-button-group");
            searchPaginationDiv.classList.add("bp3-minimal");
            searchPaginationDiv.innerHTML = `
            <span class="zotero-roam-library-results-count"></span>
            `;

            librarySearchDiv.appendChild(searchPaginationDiv);
        
            let selectedItemDiv = document.createElement('div');
            selectedItemDiv.id = "zotero-roam-search-selected-item";
            selectedItemDiv.classList.add("bp3-card");
        
            let selectedItemMetadata = document.createElement('div');
            selectedItemMetadata.classList.add("selected-item-header");
            let selectedItemGraphInfo = document.createElement('div');
            selectedItemGraphInfo.classList.add("selected-item-body");
        
            selectedItemDiv.appendChild(selectedItemMetadata);
            selectedItemDiv.appendChild(selectedItemGraphInfo);

            renderedDiv.appendChild(librarySearchDiv);
            renderedDiv.appendChild(selectedItemDiv);
        
            dialogMainPanel.appendChild(renderedDiv);

            let footerActions = document.createElement('div');
            footerActions.classList.add("bp3-dialog-footer-actions");
            footerActions.innerHTML = `
            <input class="bp3-input clipboard-copy-utility" type="text" readonly style="opacity:0;">
            <span class="bp3-popover2-target" tabindex="0">
                <button type="button" class="zotero-roam-update-data bp3-button bp3-minimal">
                <span icon="refresh" class="bp3-icon bp3-icon-refresh"></span>
                <span class="bp3-button-text">Update Zotero data</span>
                </button>
            </span>
            `;

            dialogMainPanel.appendChild(footerActions);

            // Storing info in variables
            zoteroRoam.interface.search.overlay = document.querySelector(`.${divClass}-overlay`);
            zoteroRoam.interface.search.input = document.querySelector("#zotero-roam-search-autocomplete");
            zoteroRoam.interface.search.selectedItemDiv = document.querySelector("#zotero-roam-search-selected-item");
            zoteroRoam.interface.search.closeButton = document.querySelector(`.${divClass}-overlay button.zotero-roam-search-close`);
            zoteroRoam.interface.search.updateButton = document.querySelector(`.${divClass}-overlay button.zotero-roam-update-data`);
        },

        fillCitationsOverlay(divClass = zoteroRoam.interface.citations.overlayClass){
            let dialogMainPanel = document.querySelector(`.${divClass}-overlay .bp3-dialog-body .main-panel`);
            
            let headerContent = document.createElement('div');
            headerContent.classList.add("bp3-input-group");
            headerContent.classList.add("header-content");

            // Header (left)
            let headerLeft = document.createElement('div');
            headerLeft.classList.add("header-left");

            let panelTitle = document.createElement('h5');
            panelTitle.innerText = "Citing Papers";

            let panelSubtitle = document.createElement('p');
            panelSubtitle.classList.add("bp3-text");
            panelSubtitle.classList.add("panel-subtitle");
            panelSubtitle.innerText = `Search by title, year, authors (last names), abstract, keywords, publication`;


            let searchBar = document.createElement('input');
            searchBar.id = "zotero-roam-citations-autocomplete";
            searchBar.tabIndex = "1";
            searchBar.type = "text";
            searchBar.classList.add("bp3-input");
            searchBar.classList.add("bp3-intent-warning");
            
            headerLeft.appendChild(panelTitle);
            headerLeft.appendChild(panelSubtitle);
            headerLeft.appendChild(searchBar);

            // Header (right)
            let headerRight = document.createElement('div');
            headerRight.classList.add("header-right");

            let controlsTop = document.createElement('div');
            controlsTop.classList.add("controls-top");
            controlsTop.innerHTML = `
            <button type="button" aria-label="Close" class="zotero-roam-search-close bp3-button bp3-minimal bp3-dialog-close-button">
            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>
            `;

            headerRight.appendChild(controlsTop);

            // ---

            headerContent.appendChild(headerLeft);
            headerContent.appendChild(headerRight);
            
            // ---

            let pagination = document.createElement('div');
            pagination.id = "zotero-roam-citations-pagination";
            
            let pageControls = document.createElement('div');
            pageControls.classList.add("bp3-button-group");
            pageControls.classList.add("bp3-minimal");
            pageControls.innerHTML = `
            ${zoteroRoam.utils.renderBP3Button_group(string = "", {icon: "chevron-left", buttonClass: "zotero-roam-page-control", buttonAttribute: 'goto="previous"'})}
            ${zoteroRoam.utils.renderBP3Button_group(string = "", {icon: "chevron-right", buttonClass: "zotero-roam-page-control", buttonAttribute: 'goto="next"'})}
            <span class="zotero-roam-citations-results-count"></span>
            `;
            pagination.appendChild(pageControls);

            // ---

            dialogMainPanel.appendChild(headerContent);
            dialogMainPanel.appendChild(pagination);

            // ---

            let footerActions = document.createElement('div');
            footerActions.classList.add("bp3-dialog-footer-actions");
            footerActions.innerHTML = `
            <input class="bp3-input clipboard-copy-utility" type="text" readonly style="opacity:0;">
            `;
            dialogMainPanel.appendChild(footerActions);

            
            // Storing info in variables
            zoteroRoam.interface.citations.overlay = document.querySelector(`.${divClass}-overlay`);
            zoteroRoam.interface.citations.input = document.querySelector("#zotero-roam-citations-autocomplete");
            zoteroRoam.interface.citations.closeButton = document.querySelector(`.${divClass}-overlay button.zotero-roam-search-close`);

            // Rigging page controls
            Array.from(zoteroRoam.interface.citations.overlay.querySelectorAll(".zotero-roam-page-control")).forEach(control => {
                control.addEventListener("click", (e) => { zoteroRoam.interface.changePage(goto = control.getAttribute("goto")) });
            })

            // Rigging close overlay button
            zoteroRoam.interface.citations.closeButton.addEventListener("click", zoteroRoam.interface.closeCitationsOverlay);

        },

        renderCitationsPagination(){
            let paginationDiv = document.querySelector("#zotero-roam-citations-pagination");

            let paginatedList = paginationDiv.querySelector("ul");
            if(paginatedList == null){
                paginatedList = document.createElement('ul');
                paginatedList.classList.add("zotero-roam-citations-search-results-list");
                paginatedList.classList.add("bp3-menu");
                paginatedList.tabIndex = "-1";
                paginatedList.setAttribute("role", "listbox");
                paginationDiv.appendChild(paginatedList);
            }

            let page = zoteroRoam.citations.pagination.getCurrentPageData();
            // Indicate results shown
            paginationDiv.querySelector(".zotero-roam-citations-results-count").innerHTML = `
            <strong>${zoteroRoam.citations.pagination.startIndex}-${zoteroRoam.citations.pagination.startIndex + page.length - 1}</strong> / ${zoteroRoam.citations.pagination.data.length} citations
            `;
            // Grab current page data, generate corresponding HTML, then inject as contents of paginatedList
            paginatedList.innerHTML = page.map(cit => {
                let titleEl = `<span class="zotero-roam-search-item-title" style="display:block;">${cit.title} ${cit.inLibrary ? '<span icon="endorsed" class="bp3-icon bp3-icon-endorsed bp3-intent-success"></span>' : ''}</span>`;
                // let keywordsEl = cit.keywords.length > 0 ? `<span class="zotero-roam-search-item-tags">${cit.keywords.map(w => "#" + w).join(", ")}</span>` : "";
                let origin = cit.authors + (cit.year ? " (" + cit.year + ")" : "");
                let metaEl = `<span class="zotero-roam-citation-metadata-contents">${zoteroRoam.utils.renderBP3Tag(origin, {modifier: "bp3-intent-warning"})} ${cit.meta}</span>`;
                let linksEl = "";
                for(var service of Object.keys(cit.links)){
                    let linksArray = [];
                    switch(service){
                        case "scite":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="scite"><a href="${cit.links[service]}" target="_blank">Scite</a></span>`);
                            break;
                        case "connectedPapers":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="connected-papers"><a href="${cit.links[service]}" target="_blank">Connected Papers</a></span>`);
                            break;
                        case "semanticScholar":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="semantic-scholar"><a href="${cit.links[service]}" target="_blank">Semantic Scholar</a></span>`);
                            break;
                        case "googleScholar":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="google-scholar"><a href="${cit.links[service]}" target="_blank">Google Scholar</a></span>`);
                            break;
                    }
                    linksEl += linksArray.join(" &#8226; ");
                }

                let keyEl = `
                <span class="bp3-menu-item-label zotero-roam-search-item-key">
                <a href="https://doi.org/${cit.doi}" target="_blank" class="zotero-roam-citation-doi-link">${cit.doi}</a>
                ${cit.abstract ? zoteroRoam.utils.renderBP3Button_group("Show Abstract", {buttonClass: "zotero-roam-citation-toggle-abstract bp3-minimal"}) : ""}
                ${zoteroRoam.utils.renderBP3Button_group("Copy DOI", {buttonClass: "zotero-roam-citation-copy-doi bp3-intent-primary bp3-outlined", buttonAttribute: 'data-doi="' + cit.doi + '"'})}
                </span>
                `;

                return `
                <li class="zotero-roam-citations-search_result" ${cit.inLibrary ? 'in-library="true"' : ""}>
                <div class="bp3-menu-item">
                <div class="bp3-text-overflow-ellipsis bp3-fill zotero-roam-citation-metadata">
                ${titleEl}
                ${metaEl}
                <span class="zotero-roam-citation-links-list">
                ${linksEl}
                </span>
                </div>
                ${keyEl}
                <span class="zotero-roam-citation-abstract" style="display:none;">${cit.abstract}</span>
                </div></li>
                `
            }).join("");

            // Adding interaction
            // Copy-to-clipboard buttons for DOIs
            try{
                let copyDOIBtns = Array.from(paginationDiv.querySelectorAll('button.zotero-roam-citation-copy-doi'));
                if(copyDOIBtns.length > 0){
                    for(const btn of copyDOIBtns){
                        btn.addEventListener("click", function(){
                            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').value = btn.dataset.doi;
                            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').select();
                            document.execCommand("copy");
                        })
                    }
                }
            }catch(e){};
            // Toggles for abstracts
            try{
                let abstractToggles = Array.from(paginationDiv.querySelectorAll("button.zotero-roam-citation-toggle-abstract"));
                if(abstractToggles.length > 0){
                    for(const togg of abstractToggles){
                        togg.addEventListener("click", function(){
                            let toggleText = togg.querySelector('.bp3-button-text');
                            let abstractSpan = togg.closest('.zotero-roam-citations-search_result').querySelector('.zotero-roam-citation-abstract');
                            if(abstractSpan.style.display == "none"){
                                abstractSpan.style.display = "block";
                                toggleText.innerHTML = `Hide Abstract`;
                            } else{
                                abstractSpan.style.display = "none";
                                toggleText.innerHTML = `Show Abstract`;
                            }
                        });
                        
                    }
                }
            }catch(e){};

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
                            op.addEventListener("click", () => { zoteroRoam.handlers.addItemData(zoteroRoam.interface.contextMenu.targetElement) })
                            break;
                        case "Convert to citation":
                            op.addEventListener("click", () => { zoteroRoam.inPage.convertToCitekey(zoteroRoam.interface.contextMenu.targetElement) });
                            break;
                        case "Check for citing papers":
                            op.addEventListener("click", () => { zoteroRoam.handlers.checkForScitations(zoteroRoam.interface.contextMenu.targetElement) });
                            break;
                        case "View item information":
                            op.addEventListener("click", () => { zoteroRoam.interface.popItemInformation(zoteroRoam.interface.contextMenu.targetElement) });
                            break;
                        case "Update Zotero data":
                            op.addEventListener("click", zoteroRoam.extension.update)
                            break;
                        case "Search in dataset...":
                            op.addEventListener("click", () => { zoteroRoam.interface.toggleSearchOverlay("show") });
                    }
                })
            })
        },

        toggleContextOverlay(elementKey, command){
            zoteroRoam.interface[`${elementKey}`].overlay.div.style.display = (command == "show") ? "block" : "none";
            zoteroRoam.interface[`${elementKey}`].visible = (command == "show") ? true : false;
        },

        async toggleSearchOverlay(command, {focus = true} = {}) {
            zoteroRoam.interface.search.overlay.style.display = command === "show" ? "block" : "none";
            if (command == "show") {
                console.log("Opening the Search Panel")
                if(focus == true){
                    await zoteroRoam.utils.sleep(75);
                    zoteroRoam.interface.search.input.focus();
                }
                document.querySelector(".zotero-roam-library-results-count").innerHTML = ``;
                zoteroRoam.interface.search.input.value = "";
                zoteroRoam.interface.search.overlay.setAttribute("overlay-visible", "true");
            } else {
                console.log("Closing the Search Panel")
                zoteroRoam.interface.clearSelectedItem();
                document.querySelector(".zotero-roam-library-results-count").innerHTML = ``;
                zoteroRoam.interface.search.input.value = "";
                zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = "";
                zoteroRoam.interface.search.overlay.setAttribute("overlay-visible", "false");
            }
        },

        changePage(goto){
            if(zoteroRoam.citations.pagination !== null){
                if(zoteroRoam.citations.pagination.nbPages > 0){
                    switch(goto){
                    case "previous":
                        zoteroRoam.citations.pagination.previousPage();
                        break;
                    case "next":
                        zoteroRoam.citations.pagination.nextPage();
                        break;
                    }
                }
            }
        },

        popCitationsOverlay(doi){
            zoteroRoam.citations.currentDOI = doi;
            // All citations -- paginated
            let fullData = zoteroRoam.data.scite.find(item => item.doi == doi).simplified;
            zoteroRoam.citations.pagination = new zoteroRoam.Pagination({data: fullData});
            // Render HTML for pagination
            zoteroRoam.interface.renderCitationsPagination();
            // Setup autocomplete
            if(zoteroRoam.citations.autocomplete == null){
                // zoteroRoam.config.citationsSearch.resultsList.maxResults = zoteroRoam.data.items.length;
                zoteroRoam.citations.autocomplete = new autoComplete(zoteroRoam.config.citationsSearch);
            } else {
                zoteroRoam.citations.autocomplete.init();
            }
            // Make overlay visible
            zoteroRoam.interface.citations.overlay.style.display = "block";
            zoteroRoam.interface.citations.input.value = "";
            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').value = "";
            zoteroRoam.interface.citations.overlay.setAttribute("overlay-visible", "true");
            zoteroRoam.interface.citations.input.focus();
        },

        closeCitationsOverlay(){
            zoteroRoam.interface.citations.overlay.style.display = "none";
            zoteroRoam.interface.citations.input.value = "";
            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').value = "";
            zoteroRoam.interface.citations.overlay.setAttribute("overlay-visible", "false");
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

        async popContextMenu(e){
            zoteroRoam.interface.popContextOverlay(e, "contextMenu");
            await zoteroRoam.utils.sleep(200);
            try{
                // Hide default Roam context menu
                document.querySelector('body > .bp3-context-menu+.bp3-portal').style.display = "none";
            } catch(e){};
        },

        popIconContextMenu(e){
            zoteroRoam.interface.popContextOverlay(e, "iconContextMenu");
        },

        renderNbResults(e){
            if(e.detail.results.length > 0){
            document.querySelector(".zotero-roam-library-results-count").innerHTML = `
            <strong>${e.detail.results.length}</strong> / ${e.detail.matches.length} results
            `;
            }
        },

        popItemInformation(refSpan){
            let citekey = refSpan.parentElement.dataset.linkTitle.replace("@", "");
            zoteroRoam.interface.renderItemInPanel(citekey);
        },

        renderItemInPanel(citekey){
            let itemKey = citekey.startsWith('@') ? citekey : '@' + citekey;
            let selectedItem = zoteroRoam.data.items.find(it => it.key == itemKey.slice(1));

            let itemYear = (selectedItem.meta.parsedDate) ? ` (${(new Date(selectedItem.meta.parsedDate)).getUTCFullYear().toString()})` : "";

            // Generate list of authors as bp3 tags or Roam page references
            let infoAuthors = selectedItem.data.creators.map(c => {return (c.name) ? c.name : [c.firstName, c.lastName].filter(Boolean).join(" ")});
            let infoRolesAuthors = selectedItem.data.creators.map(c => c.creatorType);
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
            let infoTags = selectedItem.data.tags.map(t => t.tag);
            let divTags = "";
            if(infoTags.length > 0){
                divTags = `<strong>Tags : </strong>`;
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
                divCollections = `<strong>Collections : </strong>`;
                try {
                    divCollections += infoCollections.map(collec => zoteroRoam.utils.renderBP3Tag(string = collec.data.name, { modifier: "bp3-intent-success bp3-round", icon: "projects" })).join(" ");
                } catch(e){
                    console.log(infoCollections);
                    console.log(e);
                    console.error("Something went wrong while getting the item's collections data");
                }
            }

            // Information about the item
            let pageInGraph = zoteroRoam.utils.lookForPage(itemKey);
            let iconName = (pageInGraph.present == true) ? "tick" : "cross";
            let iconIntent = (pageInGraph.present == true) ? "success" : "danger";
            let itemInfo = (pageInGraph.present == true) ? `In the graph` : "Not in the graph";
            if(pageInGraph.present == true){
                try{
                    let nbChildren = window.roamAlphaAPI.q('[:find (count ?chld) :in $ ?uid :where[?p :block/uid ?uid][?p :block/children ?chld]]', pageInGraph.uid)[0][0];
                    itemInfo = itemInfo + ` (<b>${nbChildren}</b> direct children)`;
                } catch(e){};
            }
            let itemInGraph = `
            <div class="item-in-graph">
            <span class="bp3-icon-${iconName} bp3-icon bp3-intent-${iconIntent}"></span>
            <span> ${itemInfo}</span></div>
            `;
            
            // Render the header section
            let headerDiv = document.querySelector(".selected-item-header");
            headerDiv.innerHTML = `
            <div class="item-basic-metadata">
                <h4 class="item-title" tabindex="0">${selectedItem.data.title || ""}${itemYear}</h4>
                <p class="item-metadata-string">${divAuthors}${zoteroRoam.utils.makeMetaString(selectedItem)}</p>
                </div>
            <div class="item-citekey-section">
                <div class="bp3-fill citekey-element">${itemKey}</div>
                <div class="bp3-button-group bp3-fill bp3-minimal copy-buttons">
                    <a class="bp3-button bp3-intent-primary" format="citekey">Copy @citekey ${(zoteroRoam.shortcuts.sequences["copyCitekey"]) ? zoteroRoam.shortcuts.makeSequenceText("copyCitekey") : ""}</a>
                    <a class="bp3-button bp3-intent-primary" format="citation">[Citation]([[@]]) ${(zoteroRoam.shortcuts.sequences["copyCitation"]) ? zoteroRoam.shortcuts.makeSequenceText("copyCitation") : ""}</a>
                    <a class="bp3-button bp3-intent-primary" format="tag">#@ ${(zoteroRoam.shortcuts.sequences["copyTag"]) ? zoteroRoam.shortcuts.makeSequenceText("copyTag") : ""}</a>
                    <a class="bp3-button bp3-intent-primary" format="page-reference">[[@]] ${(zoteroRoam.shortcuts.sequences["copyPageRef"]) ? zoteroRoam.shortcuts.makeSequenceText("copyPageRef") : ""}</a>
                </div>
                ${itemInGraph}
            </div>
            `;

            // Render the graph info section
            let bodyDiv = document.querySelector(".selected-item-body");
            
            let goToPageModifier = (pageInGraph.present == true) ? `data-uid="${pageInGraph.uid}"` : "disabled";
            let goToPageSeq = (zoteroRoam.shortcuts.sequences["goToItemPage"]) ? zoteroRoam.shortcuts.makeSequenceText("goToItemPage", pre = " ") : "";
            let pageURL = (pageInGraph.present == true) ? `https://roamresearch.com/${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${pageInGraph.uid}` : "javascript:void(0)";
            let goToPage = `
            <div class="bp3-button-group bp3-minimal bp3-fill bp3-align-left">
            ${zoteroRoam.utils.renderBP3Button_link(string = "Go to Roam page" + goToPageSeq, {linkClass: "item-go-to-page", icon: "arrow-right", iconModifier: "bp3-intent-primary", target: pageURL, linkAttribute: goToPageModifier})}
            </div>
            `;

            let importSeq = (zoteroRoam.shortcuts.sequences["importMetadata"]) ? zoteroRoam.shortcuts.makeSequenceText("importMetadata", pre = " ") : "";
            let importText = `Import metadata  ${importSeq}`;
            let importButtonGroup = zoteroRoam.utils.renderBP3ButtonGroup(string = importText, { buttonClass: "item-add-metadata", divClass: "bp3-minimal bp3-fill bp3-align-left", icon: "add", modifier: "bp3-intent-primary" });

            // Check for children items
            let infoChildren = zoteroRoam.formatting.getItemChildren(selectedItem, { pdf_as: "raw", notes_as: "raw" });
            let childrenDiv = "";
            if(infoChildren.remoteChildren){
                childrenDiv += `<p>This item has children, but they were not returned by the API data request. This might be due to a request for 'items/top' rather than 'items'.</p>`;
            } else {
                try {
                    let pdfDiv = (!infoChildren.pdfItems) ? `No PDF attachments` : infoChildren.pdfItems.map(item => {
                        let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(item.data.linkMode)) ? `zotero://open-pdf/library/items/${item.data.key}` : item.data.url;
                        let pdfTitle = item.data.filename || item.data.title;
                        return zoteroRoam.utils.renderBP3Button_link(string = pdfTitle, {linkClass: "bp3-minimal item-pdf-link", icon: "paperclip", target: pdfHref });
                    }).join("");
                    childrenDiv += pdfDiv;
                    
                    if(infoChildren.notes){
                        let toggleNotesSeq = (zoteroRoam.shortcuts.sequences["toggleNotes"]) ? zoteroRoam.shortcuts.makeSequenceText("toggleNotes", pre = " ") : "";
                        childrenDiv += `${zoteroRoam.utils.renderBP3Button_group(string = `Show Notes` + toggleNotesSeq, {buttonClass: "bp3-minimal bp3-align-left bp3-fill item-see-notes", icon: "comment"})}`;
                        zoteroRoam.interface.search.overlay.querySelector(".side-panel-contents").innerHTML = `
                        <h4>Notes</h4>
                        <div class="item-rendered-notes">
                            ${ infoChildren.notes.map(n => n.data.note).join("<br>") }
                        </div>
                        `
                    }
                } catch(e){
                    console.log(infoChildren);
                    console.log(pdfDiv);
                    console.log(e);
                    console.log("Something went wrong while getting the item's children data");
                }
            }

            bodyDiv.innerHTML = `
            <div class="item-additional-metadata">
                <p class="item-abstract">${selectedItem.data.abstractNote}</p>
                <p class="item-tags">${divTags}</p>
                <p class="item-collections">${divCollections}</p>
            </div>
            <div class="item-actions">
                <div class="bp3-card">
                    ${goToPage}
                    ${importButtonGroup}
                </div>
                <div class="item-pdf-notes">
                    ${childrenDiv}
                </div>
            </div>
            `;

            // Add event listeners to action buttons
            let pageUID = (pageInGraph.uid) ? pageInGraph.uid : "";
            document.querySelector("button.item-add-metadata").addEventListener("click", function(){
                console.log("Importing metadata...");
                zoteroRoam.handlers.addSearchResult(itemKey, pageUID, {popup: true});
            });

            Array.from(document.querySelectorAll('.item-citekey-section .copy-buttons a.bp3-button[format]')).forEach(btn => {
                btn.addEventListener("click", (e) => {
                    switch(btn.getAttribute('format')){
                        case 'citekey':
                            zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = `${itemKey}`;
                            break;
                        case 'citation':
                            let citationText = `${selectedItem.meta.creatorSummary || ""}${itemYear || ""}`;
                            zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = `[${citationText}]([[${itemKey}]])`;
                            break;
                        case 'tag':
                            zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = `#[[${itemKey}]]`;
                            break;
                        case 'page-reference':
                            zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = `[[${itemKey}]]`;
                    };
                    zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').select();
                    document.execCommand("copy");
                })
            });
            try{
                let notesButton = document.querySelector("button.item-see-notes");
                notesButton.addEventListener("click", function(){
                    let currentHTML = notesButton.querySelector('.bp3-button-text').innerHTML;
                    switch(true){
                        case (currentHTML.startsWith("Show")):
                            zoteroRoam.interface.search.overlay.querySelector(".bp3-dialog").setAttribute("side-panel", "visible");
                            notesButton.querySelector('.bp3-button-text').innerHTML = currentHTML.replace("Show", "Hide");
                            break;
                        case (currentHTML.startsWith("Hide")):
                            zoteroRoam.interface.search.overlay.querySelector(".bp3-dialog").setAttribute("side-panel", "hidden");
                            notesButton.querySelector('.bp3-button-text').innerHTML = currentHTML.replace("Hide", "Show");
                            break;
                    }
                });
            } catch(e){};

            // Finally, make the div visible
            document.querySelector("#zotero-roam-library-rendered").setAttribute("view", "item");
            switch(zoteroRoam.interface.search.overlay.getAttribute("overlay-visible")){
                case "true":
                    document.querySelector('h4.item-title').focus();
                    break;
                case "false":
                    zoteroRoam.interface.toggleSearchOverlay("show", {focus: false});
            }

        },

        clearSelectedItem(){
            try {
                zoteroRoam.interface.search.selectedItemDiv.children.forEach(c => {c.innerHTML = ``});
            } catch(e){
                Array.from(zoteroRoam.interface.search.selectedItemDiv.children).forEach(c => {c.innerHTML = ``});
            }
            zoteroRoam.interface.search.overlay.querySelector(".side-panel-contents").innerHTML = ``;
            if(zoteroRoam.interface.search.overlay.querySelector(".bp3-dialog").getAttribute("side-panel") == "visible"){
                zoteroRoam.interface.search.overlay.querySelector(".bp3-dialog").setAttribute("side-panel", "hidden");
            }
            document.querySelector("#zotero-roam-library-rendered").setAttribute("view", "search");
        },

        // Detect if a block is currently being edited
        checkEditingMode(){
            let textArea = document.querySelector("textarea.rm-block-input");
            if (!textArea || textArea.getAttribute("zotero-tribute") != null) return;

            document.querySelectorAll('.zotero-roam-tribute').forEach(d=>d.remove());

            textArea.setAttribute("zotero-tribute", "active");

            var tribute = new Tribute(zoteroRoam.config.tribute);
            tribute.attach(textArea);

            textArea.addEventListener('tribute-replaced', (e) => {
                let textArea = document.querySelector('textarea.rm-block-input');
                let trigger = e.detail.context.mentionTriggerChar + e.detail.context.mentionText;
                let triggerPos = e.detail.context.mentionPosition;

                let replacement = e.detail.item.original.value;
                let blockContents = e.target.defaultValue;

                let escapedTrigger = zoteroRoam.utils.escapeRegExp(trigger);
                let triggerRegex = new RegExp(escapedTrigger, 'g');
                let newText = blockContents.replaceAll(triggerRegex, (match, pos) => (pos == triggerPos) ? replacement : match );

                // Store info about the replacement, to help debug
                zoteroRoam.interface.tributeTrigger = trigger;
                zoteroRoam.interface.tributeBlockTrigger = textArea;
                zoteroRoam.interface.tributeNewText = newText;

                var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setValue.call(textArea, newText);

                var ev = new Event('input', { bubbles: true });
                textArea.dispatchEvent(ev);
            });

        }
    }
})();

;(()=>{
    zoteroRoam.extension = {

        async load(){
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            let requestReturns = await zoteroRoam.handlers.requestData(zoteroRoam.config.requests);
            if (!requestReturns.success) {
                zoteroRoam.interface.icon.style = `background-color:#f9a3a3 !important`;
                zoteroRoam.interface.popToast(message = "There was a problem with the Zotero data request. Please check your specification !", intent = "danger");
                throw new Error("The API request encountered a problem. Please check your request specification, and the console for any registered errors.");
            } else {
                try{
                    let keyCalls = [];
                    Array.from(new Set(zoteroRoam.config.requests.map(req => req.apikey))).forEach(key => {
                        keyCalls.push(fetch(`https://api.zotero.org/keys/${key}`, {method: 'GET', headers: {'Zotero-API-Version': 3, 'Zotero-API-Key': key}}));
                    })
                    let keyResults = await Promise.all(keyCalls);
                    keyResults = await Promise.all(keyResults.map(res => res.json()));
                    keyResults = keyResults.flat(1);
                    zoteroRoam.data.keys = keyResults;
                } catch(e){ console.error(e) };

                zoteroRoam.data.items = requestReturns.data.items;
                zoteroRoam.data.collections = requestReturns.data.collections;
                zoteroRoam.interface.icon.setAttribute("status", "on");

                // Setup the checking of citekey page references :
                zoteroRoam.inPage.checkReferences(); // initial
                document.addEventListener('blur', zoteroRoam.inPage.checkReferences, true); // on blur
                window.addEventListener('locationchange', zoteroRoam.inPage.checkReferences, true); // URL change
                zoteroRoam.config.ref_checking = setInterval(zoteroRoam.inPage.checkReferences, 1000); // continuous

                // Setup page menus :
                zoteroRoam.inPage.addPageMenus(); // initial
                window.addEventListener('locationchange', zoteroRoam.inPage.addPageMenus, true); // URL change
                zoteroRoam.config.page_checking = setInterval(zoteroRoam.inPage.addPageMenus, 1000); // continuous

                // Auto-update ?
                if(zoteroRoam.config.userSettings.autoupdate){
                    zoteroRoam.config.auto_update = setInterval(function(){zoteroRoam.extension.update(popup = false)}, 60000); // Update every 60s
                }

                // Setup the search autoComplete object
                if(zoteroRoam.librarySearch.autocomplete == null){
                    zoteroRoam.librarySearch.autocomplete = new autoComplete(zoteroRoam.config.autoComplete);
                } else {
                    zoteroRoam.librarySearch.autocomplete.init();
                }
                // Setup observer for autocompletion tribute
                if(zoteroRoam.config.params.autocomplete.enabled == true){
                    zoteroRoam.config.editingObserver = new MutationObserver(zoteroRoam.interface.checkEditingMode);
                    zoteroRoam.config.editingObserver.observe(document, { childList: true, subtree: true});
                }
                // Setup contextmenu event for the extension's icon
                zoteroRoam.interface.icon.addEventListener("contextmenu", zoteroRoam.interface.popIconContextMenu);
                // Setup keypress listeners to detect shortcuts
                window.addEventListener("keyup", zoteroRoam.shortcuts.verify);
                window.addEventListener("keydown", zoteroRoam.shortcuts.verify);

                // Adding search panel to Roam Palette
                roamAlphaAPI.ui.commandPalette.addCommand({
                    label: 'zoteroRoam : Open the search panel', 
                    callback: () => {
                        zoteroRoam.interface.toggleSearchOverlay("show");
                    }
                });

                zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                zoteroRoam.interface.popToast(message = "Zotero data successfully loaded !", intent = "success");
                console.log('The results of the API request have been received ; you can check them by inspecting the value of the zoteroRoam.data object. Data import context menu should now be available.');

            }
        },

        unload(){
            zoteroRoam.interface.icon.setAttribute("status", "off");
            zoteroRoam.data.items = [];
            zoteroRoam.data.collections = [];
            zoteroRoam.data.scite = [];
            zoteroRoam.data.keys = [];

            if(zoteroRoam.librarySearch.autocomplete !== null){
                zoteroRoam.librarySearch.autocomplete.unInit();
            }
            if(zoteroRoam.citations.autocomplete !== null){
                zoteroRoam.citations.autocomplete.unInit();
            }

            // Remove in-page menus
            Array.from(document.querySelectorAll(".zotero-roam-page-div")).forEach(div => div.remove());

            // Remove request results
            let refCitekeys = document.querySelectorAll("ref-citekey");
            refCitekeys.forEach(ck => { 
                ck.removeAttribute("data-zotero-bib"); 
                ck.querySelector(".rm-page-ref").removeEventListener("contextmenu", zoteroRoam.interface.popContextMenu)});
            zoteroRoam.interface.icon.removeEventListener("contextmenu", zoteroRoam.interface.popIconContextMenu);

            document.removeEventListener('blur', zoteroRoam.inPage.checkReferences, true);
            window.removeEventListener('locationchange', zoteroRoam.inPage.checkReferences, true);
            try { clearInterval(zoteroRoam.config.ref_checking) } catch(e){};
            try { clearInterval(zoteroRoam.config.page_checking) } catch(e){};
            try { clearInterval(zoteroRoam.config.auto_update) } catch(e){};
            try { zoteroRoam.config.editingObserver.disconnect() } catch(e){};
            window.removeEventListener("keyup", zoteroRoam.shortcuts.verify);
            window.removeEventListener("keydown", zoteroRoam.shortcuts.verify);

            // Removing search panel opening from Roam Palette
            roamAlphaAPI.ui.commandPalette.removeCommand({
                label: 'zoteroRoam : Open the search panel'
            });

            zoteroRoam.interface.icon.removeAttribute("style");
            zoteroRoam.interface.popToast(message = "All Zotero data was cleared. Bye for now !", intent = "success");
            console.log('Data and request outputs have been removed');
        },
        
        toggle(){
            if(zoteroRoam.interface.icon.getAttribute('status') == "off"){
                zoteroRoam.extension.load();
            } else {
                zoteroRoam.extension.unload();
            }
        },

        async update(popup = "true"){
            // Turn the icon background to orange while we're updating the data
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            // For each request, get the latest version of any item that belongs to it
            let updateRequests = zoteroRoam.config.requests.map(rq => {
                let latest = zoteroRoam.data.libraries.find(lib => lib.prefix == rq.library).version;
                let {apikey, dataURI, params: setParams, name, library} = rq;
                let paramsQuery = new URLSearchParams(setParams);
                paramsQuery.set('since', latest);
                setParams = paramsQuery.toString();
                return {
                    apikey: apikey,
                    dataURI: dataURI,
                    params: setParams,
                    name: name,
                    library: library
                };
            });
            let updateResults = await zoteroRoam.handlers.requestData(updateRequests);
            if(updateResults.success == true){
                zoteroRoam.data.collections = updateResults.data.collections; // Collections are fetched without a 'since' parameter, so simply replacing the whole Object is fine
                
                let updatedItems = updateResults.data.items;
                if(updatedItems.length == 0){
                    if(popup) {
                        zoteroRoam.interface.popToast("No new items were found since the data was last loaded. Data on collections was refreshed.", "primary");
                    };
                    zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                } else {
                    let newItems = zoteroRoam.handlers.extractCitekeys(updatedItems);
                    let nbNewItems = newItems.length;
                    let nbModifiedItems = 0;

                    updatedItems.forEach(item => {
                        let duplicateIndex = zoteroRoam.data.items.findIndex(libItem => {return libItem.key == item.key & libItem.requestLabel == item.requestLabel});
                        if(duplicateIndex == -1){
                            zoteroRoam.data.items.push(item);
                        } else {
                            zoteroRoam.data.items[duplicateIndex] = item;
                            nbModifiedItems += 1;
                            nbNewItems -= 1;
                        }
                    });

                    zoteroRoam.inPage.checkCitekeys(update = true);
                    if(popup) {
                        zoteroRoam.interface.popToast(`${nbNewItems} new items and ${nbModifiedItems} modified items were added.`, "primary");
                    } else{
                        console.log(`${nbNewItems} new items and ${nbModifiedItems} modified items were added.`);
                    };
                    zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                }

            } else {
                if(popup){
                    zoteroRoam.interface.popToast("Something went wrong when updating the data. Check the console for any errors.", "warning");
                } else{
                    console.log("Something went wrong when updating the data. Check the console for any errors.");
                };
            }
        }
    };
})();

;(()=>{
    zoteroRoam.inPage = {

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

        async addPageMenus(){
            let openPages = Array.from(document.querySelectorAll("h1.rm-title-display"));
            for(const page of openPages) {
                let title = page.querySelector("span") ? page.querySelector("span").innerText : "";
                if(title.startsWith("@")){
                    let itemInLib = zoteroRoam.data.items.find(it => it.key == title.slice(1));
                    // If the item is in the library
                    if(typeof(itemInLib) !== 'undefined'){
                        let itemDOI = !itemInLib.data.DOI ? "" : zoteroRoam.utils.parseDOI(itemInLib.data.DOI);
                        // Check if div wrapper already exists, creates it otherwise
                        if(page.parentElement.querySelector(".zotero-roam-page-div") == null){
                            let pageDiv = document.createElement("div");
                            pageDiv.classList.add("zotero-roam-page-div");
                            if(itemDOI){
                                pageDiv.innerHTML = `
                                <span class="zotero-roam-page-doi" data-doi="${itemDOI}">
                                <a href="https://doi.org/${itemDOI}" target="_blank">${itemDOI}</a>
                                </span>
                                `;
                            }
                            
                            page.parentElement.appendChild(pageDiv);
                        }

                        // List of default elements to include
                        let menu_defaults = zoteroRoam.config.params.pageMenu.defaults;

                        // Page menu
                        if(page.parentElement.querySelector(".zotero-roam-page-menu") == null){
                            let menuDiv = document.createElement("div");
                            menuDiv.classList.add("zotero-roam-page-menu");

                            page.parentElement.querySelector(".zotero-roam-page-div").appendChild(menuDiv);

                            // "Add metadata"
                            let addMetadata_element = ``;
                            if(menu_defaults.includes("addMetadata")){
                                addMetadata_element = zoteroRoam.utils.renderBP3Button_group(string = "Add metadata", {buttonClass: "bp3-minimal zotero-roam-page-menu-add-metadata", icon: "add"});
                            }

                            let itemChildren = zoteroRoam.formatting.getItemChildren(itemInLib, { pdf_as: "raw", notes_as: "raw" });
                            
                            // "Import notes"
                            let importNotes_element = ``;
                            if(menu_defaults.includes("importNotes")){
                                importNotes_element = !itemChildren.notes ? "" : zoteroRoam.utils.renderBP3Button_group(string = "Import notes", {buttonClass: "bp3-minimal zotero-roam-page-menu-import-notes", icon: "comment"});
                            }

                            // "View item information"
                            let viewItemInfo_element = ``;
                            if(menu_defaults.includes("viewItemInfo")){
                                viewItemInfo_element = zoteroRoam.utils.renderBP3Button_group(string = "View item information", {buttonClass: "bp3-minimal zotero-roam-page-menu-view-item-info", icon: "info-sign"});
                            }

                            let openZoteroLocal_element = ``;
                            if(menu_defaults.includes("openZoteroLocal")){
                                openZoteroLocal_element = zoteroRoam.utils.renderBP3Button_link(string = "Open in Zotero (local)", {linkClass: "bp3-minimal zotero-roam-page-menu-open-zotero-local", target: zoteroRoam.formatting.getLocalLink(itemInLib, {format: "target"})});
                            }
                            let openZoteroWeb_element = ``;
                            if(menu_defaults.includes("openZoteroWeb")){
                                openZoteroWeb_element = zoteroRoam.utils.renderBP3Button_link(string = "Open in Zotero (web)", {linkClass: "bp3-minimal zotero-roam-page-menu-open-zotero-web", target: zoteroRoam.formatting.getWebLink(itemInLib, {format: "target"})});
                            }

                            // PDF links
                            let pdfLinks_element = ``;
                            if(menu_defaults.includes("pdfLinks")){
                                pdfLinks_element =!itemChildren.pdfItems ? "" : itemChildren.pdfItems.map(item => {
                                    let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(item.data.linkMode)) ? `zotero://open-pdf/library/items/${item.data.key}` : item.data.url;
                                    let pdfTitle = item.data.filename || item.data.title;
                                    return zoteroRoam.utils.renderBP3Button_link(string = pdfTitle, {linkClass: "bp3-minimal zotero-roam-page-menu-pdf-link", icon: "paperclip", target: pdfHref });
                                }).join("");
                            }

                            // Web records
                            let records_list = [];
                            // Connected Papers
                            if(menu_defaults.includes("connectedPapers")){
                                records_list.push(zoteroRoam.utils.renderBP3Button_link(string = "Connected Papers", {icon: "layout", linkClass: "bp3-minimal bp3-intent-primary zotero-roam-page-menu-connected-papers", linkAttribute: `target="_blank"`, target: `https://www.connectedpapers.com/${(!itemInLib.data.DOI) ? "search?q=" + encodeURIComponent(itemInLib.data.title) : "api/redirect/doi/" + itemDOI}`}));
                            }
                            // Semantic Scholar
                            if(menu_defaults.includes("semanticScholar")){
                                records_list.push((!itemInLib.data.DOI) ? "" : zoteroRoam.utils.renderBP3Button_link(string = "Semantic Scholar", {icon: "bookmark", linkClass: "bp3-minimal bp3-intent-primary zotero-roam-page-menu-semantic-scholar", linkAttribute: `target="_blank"`, target: `https://api.semanticscholar.org/${itemDOI}`}));
                            }
                            // Google Scholar
                            if(menu_defaults.includes("googleScholar")){
                                records_list.push(zoteroRoam.utils.renderBP3Button_link(string = "Google Scholar", {icon: "learning", linkClass: "bp3-minimal bp3-intent-primary zotero-roam-page-menu-google-scholar", linkAttribute: `target="_blank"`, target: `https://scholar.google.com/scholar?q=${(!itemInLib.data.DOI) ? encodeURIComponent(itemInLib.data.title) : itemDOI}`}));
                            }

                            let backlinksLib = "";
                            if(menu_defaults.includes("citingPapers") && itemInLib.data.DOI){
                                let citeObject = await zoteroRoam.handlers.requestScitations(itemDOI);
                                let scitingDOIs = citeObject.citations.map(cit => cit.doi);
                                
                                if(scitingDOIs.length > 0){
                                    let doiPapers = zoteroRoam.data.items.filter(it => it.data.DOI);
                                    let papersInLib = doiPapers.filter(it => scitingDOIs.includes(zoteroRoam.utils.parseDOI(it.data.DOI)));
                                    backlinksLib = "<hr>";
                                    backlinksLib += zoteroRoam.utils.renderBP3Button_group(string = `${papersInLib.length > 0 ? papersInLib.length : "No"} citations in library`, {buttonClass: "bp3-minimal bp3-intent-success zotero-roam-page-menu-backlinks-button", icon: "caret-down bp3-icon-standard rm-caret rm-caret-closed"});

                                    backlinksLib += zoteroRoam.utils.renderBP3Button_group(string = `${scitingDOIs.length} citations available`, {buttonClass: "bp3-minimal bp3-intent-warning zotero-roam-page-menu-backlinks-total", icon: "citation", buttonAttribute: `data-doi=${itemDOI}`});

                                    if(papersInLib.length > 0){
                                        backlinksLib += `
                                        <ul class="zotero-roam-page-menu-backlinks-list" style="display:none;">
                                        ${papersInLib.map(paper => {
                                            let paperInGraph = zoteroRoam.utils.lookForPage("@" + paper.key);
                                            switch(paperInGraph.present){
                                                case true:
                                                    return `
                                                    <li class="zotero-roam-page-menu-backlinks-item">
                                                    ${zoteroRoam.utils.renderBP3Button_group(string = "", {buttonClass: "bp3-minimal bp3-small zotero-roam-page-menu-backlink-open-sidebar", icon: "two-columns", buttonAttribute: `data-uid="${paperInGraph.uid}" title="Open in sidebar"`})}
                                                    <a href="https://roamresearch.com/${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${paperInGraph.uid}">${zoteroRoam.utils.formatItemReference(paper, "zettlr_accent")}</a>
                                                    </li>`;
                                                default:
                                                    return `
                                                    <li class="zotero-roam-page-menu-backlinks-item">
                                                    ${zoteroRoam.utils.renderBP3Button_group(string = "", {buttonClass: "bp3-minimal bp3-small zotero-roam-page-menu-backlink-add-sidebar", icon: "add-column-right", buttonAttribute: `data-title="@${paper.key}" title="Add & open in sidebar"`})}
                                                    ${zoteroRoam.utils.formatItemReference(paper, "zettlr_accent")}
                                                    </li>`
                                            }
                                        }).join("")}
                                        </ul>
                                        `
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
                            ${records_list.length == 0 ? "" : records_list.join("")}
                            </div>
                            </div>
                            <div class="zotero-roam-page-menu-citations">
                            ${backlinksLib}
                            </div>
                            `;

                            // Adding event listeners for action buttons

                            try{
                                menuDiv.querySelector(".zotero-roam-page-menu-add-metadata").addEventListener("click", function(){
                                    let pageInGraph = zoteroRoam.utils.lookForPage(title);
                                    console.log(`Importing metadata to ${title} (${pageInGraph.uid})...`);
                                    zoteroRoam.handlers.addSearchResult(title, uid = pageInGraph.uid, {popup: true});
                                });
                            } catch(e){};
                            try{
                                menuDiv.querySelector(".zotero-roam-page-menu-import-notes").addEventListener("click", function(){
                                    let pageInGraph = zoteroRoam.utils.lookForPage(title);
                                    console.log(`Adding notes to ${title} (${pageInGraph.uid})...`);
                                    zoteroRoam.handlers.addItemNotes(title = title, uid = pageInGraph.uid);
                                });
                            } catch(e){};
                            try{
                                menuDiv.querySelector(".zotero-roam-page-menu-view-item-info").addEventListener("click", function(){
                                    zoteroRoam.interface.renderItemInPanel(citekey = title);
                                });
                            } catch(e){};
                            try{
                                let backlinksButton = menuDiv.querySelector(".zotero-roam-page-menu-backlinks-button");
                                backlinksButton.addEventListener("click", function(){
                                    // Change caret class & show the backlinks list
                                    let caretEl = backlinksButton.querySelector(".bp3-icon-caret-down");
                                    let backlinksList = backlinksButton.parentElement.querySelector(".zotero-roam-page-menu-backlinks-list");

                                    if(Array.from(caretEl.classList).includes("rm-caret-closed") && backlinksList){
                                        caretEl.classList.replace("rm-caret-closed", "rm-caret-open");
                                        backlinksList.style.display = "block";
                                    } else if(Array.from(caretEl.classList).includes("rm-caret-open")){
                                        caretEl.classList.replace("rm-caret-open", "rm-caret-closed");
                                        backlinksList.style.display = "none";
                                    }
                                });
                                let backlinksList = menuDiv.querySelector(".zotero-roam-page-menu-backlinks-list");
                                if(backlinksList){
                                    let backlinksInGraph = Array.from(backlinksList.querySelectorAll(".zotero-roam-page-menu-backlink-open-sidebar"));
                                    if(backlinksInGraph.length > 0){
                                        for(const el of backlinksInGraph){
                                            el.addEventListener("click", function(){
                                                zoteroRoam.utils.addToSidebar(uid = el.dataset.uid)
                                            })
                                        }
                                    }
                                    let backlinksLibOnly = Array.from(backlinksList.querySelectorAll(".zotero-roam-page-menu-backlink-add-sidebar"));
                                    if(backlinksLibOnly.length > 0){
                                        for(const el of backlinksLibOnly){
                                            el.addEventListener("click", async function(){
                                                let elUID = roamAlphaAPI.util.generateUID();
                                                roamAlphaAPI.createPage({'page': {'title': el.dataset.title, 'uid': elUID}});
                                                await zoteroRoam.handlers.addSearchResult(title = el.dataset.title, uid = elUID, {popup: false});
                                                zoteroRoam.utils.addToSidebar(uid = elUID);
                                            })
                                        }
                                    }
                                }
                            } catch(e){};
                            try{
                                let citationsButton = menuDiv.querySelector(".zotero-roam-page-menu-backlinks-total");
                                citationsButton.addEventListener("click", function(){
                                    zoteroRoam.interface.citations.overlay.querySelector(".header-content h5").innerText = `Papers citing ${title}`;
                                    let doi = citationsButton.getAttribute("data-doi");
                                    zoteroRoam.interface.popCitationsOverlay(doi);
                                });
                            } catch(e){};
                        }

                        // Badge from scite.ai
                        if(menu_defaults.includes("sciteBadge")){
                            if(itemInLib.data.DOI && page.parentElement.querySelector(".scite-badge") == null){
                                let sciteBadge = zoteroRoam.inPage.makeSciteBadge(doi = itemDOI);
                                page.parentElement.querySelector(".zotero-roam-page-menu-header").appendChild(sciteBadge);
                                // Manual trigger to insert badges
                                window.__SCITE.insertBadges();
                            }
                        }
                    } else {
                        try{
                            page.parentElement.querySelector(".zotero-roam-page-div").remove();
                        } catch(e){};
                    }
                }
            };
        },

        makeSciteBadge(doi, {layout = "horizontal", showZero = "true", showLabels = "false"} = {}){
            let sciteBadge = document.createElement("div");
            sciteBadge.classList.add("scite-badge");
            sciteBadge.setAttribute("data-doi", doi);
            sciteBadge.setAttribute("data-layout", layout);
            sciteBadge.setAttribute("data-show-zero", showZero);
            sciteBadge.setAttribute("data-show-labels", showLabels);

            return sciteBadge;
        }
    }
})();

;(()=>{
    zoteroRoam.formatting = {

        getCreators(item, {creators_as = "string", brackets = true, use_type = true} = {}){
            let creatorsInfoList = item.data.creators.map(creator => {
                let nameTag = (creator.name) ? `${creator.name}` : `${[creator.firstName, creator.lastName].filter(Boolean).join(" ")}`;
                return {
                    name: nameTag,
                    type: creator.creatorType,
                    inGraph: zoteroRoam.utils.lookForPage(nameTag)
                }
            });
            switch(creators_as){
                case "identity":
                    return creatorsInfoList;
                case "array":
                    return creatorsInfoList.map(c => c.name);
                case "string":
                default:
                    if(use_type == true){
                        return creatorsInfoList.map(creator => {
                            let creatorTag = brackets == true ? `[[${creator.name}]]` : creator.name;
                            return creatorTag + `(${creator.type})`;
                        }).join(", ");
                    } else {
                        return creatorsInfoList.map(creator => {
                            return (brackets == true ? `[[${creator.name}]]` : creator.name);
                        }).join(", ");
                    }
            }
        },

        async getItemBib(item, {include = "bib", style = "apa", linkwrap = 0, locale = "en-US"} = {}){
            // If the user included bib in their request, no need to call the API
            let bibHTML = (item.bib) ? item.bib : (await zoteroRoam.handlers.requestItemBib(item, {include: include, style: style, linkwrap: linkwrap, locale: locale}));
            return zoteroRoam.utils.formatBib(bibHTML);
        },

        getChildrenInDataset(item){
            let childn = zoteroRoam.data.items.filter(i => i.data.parentItem == item.data.key & i.library.id == item.library.id);
            if(childn.length > 0){
                return childn;
            } else {
                return false;
            }
        },

        // For a given item, returns an object with two properties :
        // - pdfItems : an Array of Markdown-style links to the local copy of each PDF file attached to the item
        // - notes : an Array of Arrays, where each child Array corresponds to a single note attached to the item (with each element being the note's contents, as delimited by newline)
        // If either is non-existent/unavailable, it takes the value `false`
        // If the item has children that were not returned by the API call, the object will have a property `remoteChildren` set to `true`.
        // User can check if that's the case, and decide to call zoteroRoam.handlers.requestItemChildren to obtain those children ; if any, they will be returned raw (user will have to format)
        getItemChildren(item, { pdf_as = "links", notes_as = "formatted", split_char = zoteroRoam.config.params.notes["split_char"] } = {}){
            let childrenObject = {pdfItems: false, notes: false};
            let itemChildren = [];

            if(item.meta.numChildren > 0){
                let childrenInDataset = zoteroRoam.formatting.getChildrenInDataset(item);
                if(!childrenInDataset){
                    childrenObject.remoteChildren = true;
                } else {
                    itemChildren = childrenInDataset;
                }
            }
            switch(pdf_as){
                case "raw":
                    let pdfResults = itemChildren.filter(c => c.data.contentType == "application/pdf");
                    childrenObject.pdfItems = (pdfResults.length == 0) ? false : pdfResults;
                    break;
                case "identity":
                    let pdfIdentity = itemChildren.filter(c => c.data.contentType == "application/pdf");
                    childrenObject.pdfItems = (pdfIdentity.length == 0) ? false : pdfIdentity.map(file => {return {title: file.data.title, key: file.key, link: zoteroRoam.utils.makePDFLinks(file)}});
                    break;
                case "links":
                    childrenObject.pdfItems = zoteroRoam.utils.makePDFLinks(itemChildren.filter(c => c.data.contentType == "application/pdf"));
                    break;
            };

            let notesResults = itemChildren.filter(c => c.data.itemType == "note");

            switch(notes_as){
                case "raw":
                    childrenObject.notes = (notesResults.length == 0) ? false : notesResults;
                    break;
                case "formatted":
                    childrenObject.notes = (notesResults.length == 0) ? false : zoteroRoam.handlers.formatNotes(notes = notesResults, use = zoteroRoam.config.params.notes.use, split_char = split_char);
                    break;
            }

            return childrenObject;
        },

        getItemCollections(item){
            if(item.data.collections.length > 0){
                return item.data.collections.map(collecID => zoteroRoam.data.collections.find(collec => collec.key == collecID && collec.library.id == item.library.id));
            } else {
                return false;
            }
        },

        getItemRelated(item, return_as = "citekeys"){
            if(item.data.relations){
                let relatedItems = [];
                for(rel of Object.values(item.data.relations)){
                    for(match of rel.matchAll(/http:\/\/zotero.org\/(.*)\/items\/(.+)/g)){
                        relatedItems.push({lib: match[1], key: match[2]});
                    }
                }
                let itemsData = relatedItems.map((it) => {
                    return zoteroRoam.data.items.find(el => el.data.key == it.key && `${el.library.type}s/${el.library.id}` == it.lib) || false;
                }).filter(Boolean);
                switch(return_as){
                    case "raw":
                        return itemsData;
                    case "citekeys":
                        return itemsData.map(el => "[[@" + el.key + "]]");
                }
            } else{
                return [];
            }
        },

        getItemType(item){
            let mapping = zoteroRoam.typemap[item.data.itemType] || item.data.itemType;
            if(zoteroRoam.config.userSettings.typemap){
                mapping = zoteroRoam.config.userSettings.typemap[item.data.itemType] || mapping;
            }
            return mapping;
        },

        getLocalLink(item, {format = "markdown", text = "Local library"} = {}){
            let target = `zotero://select/library/items/${item.data.key}`;
            switch(format){
                case "target":
                default:
                    return target;
                case "markdown":
                    return `[${text}](${target})`;
            }
        },

        getWebLink(item, {format = "markdown", text = "Web library"} = {}){
            let webURI = ((item.library.type = "user") ? "users" : "groups") + `/${item.library.id}`;
            let target = `https://www.zotero.org/${webURI}/items/${item.data.key}`;
            switch(format){
                case "target":
                default:
                    return target;
                case "markdown":
                    return `[${text}](${target})`;
            }
        },

        getTags(item){
            return item.data.tags.map(i => '#[[' + i.tag + ']]').join(", ");
        },

        getItemMetadata(item) {
            let metadata = [];
    
            if (item.data.title) { metadata.push(`Title:: ${item.data.title}`) }; // Title, if available
            if (item.data.creators.length > 0) { metadata.push(`Author(s):: ${zoteroRoam.formatting.getCreators(item, {creators_as: "string", brackets: true, use_type: true})}`) }; // Creators list, if available
            if (item.data.abstractNote) { metadata.push(`Abstract:: ${item.data.abstractNote}`) }; // Abstract, if available
            if (item.data.itemType) { metadata.push(`Type:: [[${zoteroRoam.formatting.getItemType(item)}]]`) }; // Item type, from typemap or zoteroRoam.typemap (fall back on the raw value)
            metadata.push(`Publication:: ${ item.data.publicationTitle || item.data.bookTitle || "" }`)
            if (item.data.url) { metadata.push(`URL : ${item.data.url}`) };
            if (item.data.dateAdded) { metadata.push(`Date Added:: ${zoteroRoam.utils.makeDNP(item.data.dateAdded, {brackets: true})}`) }; // Date added, as Daily Notes Page reference
            metadata.push(`Zotero links:: ${zoteroRoam.formatting.getLocalLink(item)}, ${zoteroRoam.formatting.getWebLink(item)}`); // Local + Web links to the item
            if (item.data.tags.length > 0) { metadata.push(`Tags:: ${zoteroRoam.formatting.getTags(item)}`) }; // Tags, if any
            
            let children = zoteroRoam.formatting.getItemChildren(item, {pdf_as: "links", notes_as: "formatted"});
            if(children.pdfItems){
                metadata.push(`PDF links : ${children.pdfItems.join(", ")}`);
            }
            if(children.notes){
                let notesBlock = {string: `[[Notes]]`, children: []};
                notesBlock.children.push(...children.notes.flat(1));
                metadata.push(notesBlock);
            }
        
            return metadata; 
        }

    }
})();

;(()=>{
    zoteroRoam.shortcuts = {
        actions: {
            closeSearchPanel: {
                defaultShortcut: {'Escape': true},
                execute(){
                    let openOverlay = document.querySelector(`.bp3-overlay[overlay-visible="true"]`) || false;
                    if(openOverlay){
                        if(Array.from(openOverlay.classList).includes(`${zoteroRoam.interface.search.overlayClass}-overlay`)){
                            zoteroRoam.interface.toggleSearchOverlay("hide");
                        } else if(Array.from(openOverlay.classList).includes(`${zoteroRoam.interface.citations.overlayClass}-overlay`)){
                            zoteroRoam.interface.closeCitationsOverlay();
                        }
                    }
                }
            },
            toggleSearchPanel: {
                defaultShortcut: {altKey: true, 'q': true},
                execute(){
                    if(zoteroRoam.interface.citations.overlay.getAttribute("overlay-visible") == "true"){
                        zoteroRoam.interface.closeCitationsOverlay();
                    } else{
                        let cmd = zoteroRoam.interface.search.overlay.getAttribute("overlay-visible") == "true" ? "hide" : "show";
                        zoteroRoam.interface.toggleSearchOverlay(cmd);
                    }
                }
            },
            toggleQuickCopy: {
                defaultShortcut: [],
                execute(){
                    document.getElementById("zotero-roam-quick-copy-mode").click();
                }
            },
            importMetadata: {
                defaultShortcut: [],
                execute(){
                    let addItemMetadataButton = document.querySelector("button.item-add-metadata");
                    if(addItemMetadataButton !== null){
                        addItemMetadataButton.click();
                    }
                }
            },
            focusSearchBar: {
                defaultShortcut: [],
                execute(){
                    let openOverlay = document.querySelector(`.bp3-overlay[overlay-visible="true"]`) || false;
                    if(openOverlay){
                        openOverlay.querySelector(`input.bp3-input[type="text"]`).focus()
                    }
                }
            },
            goToItemPage: {
                defaultShortcut: [],
                execute(){
                    let goToPageEl = document.querySelector("a.item-go-to-page");
                    if(goToPageEl && zoteroRoam.interface.search.overlay.getAttribute("overlay-visible") == "true"){
                        goToPageEl.click();
                    }
                }
            },
            copyCitekey: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey-section .copy-buttons a.bp3-button[format="citekey"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            copyCitation: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey-section .copy-buttons a.bp3-button[format="citation"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            copyTag: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey-section .copy-buttons a.bp3-button[format="tag"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            copyPageRef: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey-section .copy-buttons a.bp3-button[format="page-reference"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            toggleNotes: {
                defaultShortcut: [],
                execute(){
                    let notesButton = document.querySelector('.zotero-roam-search-overlay[overlay-visible="true"] button.item-see-notes');
                    if(notesButton !== null){
                        notesButton.click();
                    }
                }
            }
        },

        sequences: {},

        getSequences(action){
            let shortcuts = zoteroRoam.config.shortcuts.filter(sh => sh.action == action);
            if(shortcuts.length == 0){
                return false;
            } else {
                let arraySequences = shortcuts.map(sh => {
                    let activeKeys = []; 
                    for(key in sh.template){
                        if(sh.template[key] == true){
                            let cleanKey = (key.endsWith("Key")) ? key.slice(0,-3) : key;
                            activeKeys.push(cleanKey);
                        };
                    } 
                    return activeKeys;
                });
                return arraySequences.map(seq => seq.join("-")).join(" or ");
            }
        },

        generateSequences(){
            for(action in zoteroRoam.shortcuts.actions){
                let shortcutSequences = zoteroRoam.shortcuts.getSequences(action);
                if(shortcutSequences){
                    zoteroRoam.shortcuts.sequences[action] = shortcutSequences;
                }
            }
        },

        makeSequenceText(action, pre = "", post = ""){
            return `${pre}<span class="zotero-roam-sequence">${zoteroRoam.shortcuts.sequences[action]}</span>`;
        },

        setup(){
            let defaultTemplates = {};
            Object.keys(zoteroRoam.shortcuts.actions).forEach(action => {
                defaultTemplates[action] = zoteroRoam.shortcuts.actions[action].defaultShortcut;
            });

            let templates = {};
            if(zoteroRoam.config.userSettings.shortcuts){
                Object.keys(zoteroRoam.shortcuts.actions).forEach(action => {
                    let { [action] : temp = defaultTemplates[action] } = zoteroRoam.config.userSettings.shortcuts;
                    templates[action] = temp;
                });
            } else{
                templates = defaultTemplates;
            }

            let shortcutObjects = [];
            for(k in templates){
                if(templates[k].constructor === Object){ 
                    shortcutObjects.push({ action: k, template: templates[k]});
                } else if(templates[k].constructor === Array){
                    templates[k].forEach(tem => {
                        shortcutObjects.push({ action: k, template: tem});
                    })
                }
            }
            shortcutObjects.forEach(obj => {
                zoteroRoam.config.shortcuts.push(new zoteroRoam.Shortcut(obj));
            });
        },

        setupSequences(){
            zoteroRoam.shortcuts.generateSequences();

            // Search Panel : toggle, close
            let toggleSeqText = (zoteroRoam.shortcuts.sequences["toggleSearchPanel"]) ? zoteroRoam.shortcuts.makeSequenceText("toggleSearchPanel", pre = "Toggle panel with ") : "";
            let closeSeqText = (zoteroRoam.shortcuts.sequences["closeSearchPanel"]) ? zoteroRoam.shortcuts.makeSequenceText("closeSearchPanel", pre = "Exit with ") : "";
            if(toggleSeqText.length > 0 | closeSeqText.length > 0){
                let spanSeqs = document.createElement('span');
                spanSeqs.style = `font-style:italic;font-size:0.8em;margin:10px;`;
                spanSeqs.innerHTML = `${[toggleSeqText, closeSeqText].filter(Boolean).join(" / ")}  `;
                let searchTopControls = zoteroRoam.interface.search.overlay.querySelector(`.controls-top`);
                searchTopControls.insertBefore(spanSeqs, zoteroRoam.interface.search.closeButton);

                if(closeSeqText.length > 0){
                    let citationsSearchTopControls = zoteroRoam.interface.citations.overlay.querySelector(`.controls-top`);
                    let spanSeq = document.createElement('span');
                    spanSeq.style = `font-style:italic;font-size:0.8em;margin:10px;`;
                    spanSeq.innerHTML = `${closeSeqText}`;
                    citationsSearchTopControls.insertBefore(spanSeq, zoteroRoam.interface.citations.closeButton);
                }
            };
            // Quick Copy : toggle
            let qcText = (zoteroRoam.shortcuts.sequences["toggleQuickCopy"]) ? zoteroRoam.shortcuts.makeSequenceText("toggleQuickCopy", pre = " ") : "";
            if(qcText.length > 0){
                zoteroRoam.interface.search.overlay.querySelector(".quick-copy-element").innerHTML += qcText;
            };
            // Import metadata => in rendering of selected item
            // Focus searchbar
            let focusSearchBarText = (zoteroRoam.shortcuts.sequences["focusSearchBar"]) ? zoteroRoam.shortcuts.makeSequenceText("focusSearchBar") : "";
            if(focusSearchBarText.length > 0){
                let spanSeq = document.createElement('span');
                spanSeq.classList.add("bp3-input-action");
                spanSeq.style = `height:30px;padding:5px;`;
                spanSeq.innerHTML = `${focusSearchBarText}`;
                Array.from(document.querySelectorAll(`#${zoteroRoam.interface.portal.id} input.bp3-input[type="text"]`)).forEach(bar => bar.closest('.bp3-input-group').appendChild(spanSeq.cloneNode(true)));
            }
            // Go to item page => in rendering of selected item
            // Copy buttons => in rendering of selected item
            // Toggle notes => in rendering of selected item
        },

        verify(e){
            let keyName = e.key;
            let keyPressed = (e.type == "keydown") ? true : false;
            let specialKeys = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
            // Update all the watchers
            zoteroRoam.config.shortcuts = zoteroRoam.config.shortcuts.map(sh => {
                let {action, template, watcher} = sh;
                // Update status of special keys
                specialKeys.forEach(k => { watcher[k] = e[k] });
                // If the key is part of the shortcut template, update its real-time status (true = pressed, false = not pressed)
                if(template.hasOwnProperty(keyName) | template.hasOwnProperty(keyName.toLowerCase())){
                    let watchedName = (template.hasOwnProperty(keyName)) ? keyName : keyName.toLowerCase();
                    watcher[watchedName] = keyPressed };
                return {
                    action: action,
                    template: template,
                    watcher: watcher
                };
            });
            // Once all the watchers have been updated, compare the watchers against the templates & decide whether an action should be triggered
            // Note that if two shortcuts are somehow triggered in the same combination of keys, they'll be processed in order of declaration
            zoteroRoam.config.shortcuts.forEach(sh => {
                if(JSON.stringify(sh.watcher) === JSON.stringify(sh.template)){
                    zoteroRoam.shortcuts.actions[`${sh.action}`].execute();
                }
            });
        }
    }
})();

;(()=>{
    // This code will run on re/load
    // It contains the interactive portion of the setup (reading user specifications, and setting up certain objects accordingly)
    if (typeof(window.zoteroRoam_settings) !== 'undefined') {
        // Add DOM interface elements + set them up
        zoteroRoam.interface.create();
        zoteroRoam.interface.setup();
        zoteroRoam.addExtensionCSS();
        window.addEventListener("hashchange", () => { zoteroRoam.interface.toggleSearchOverlay("hide") });

        zoteroRoam.config.userSettings = window.zoteroRoam_settings;

        // Check for additional settings
        // override_quickcopy
        let qc_override_key = zoteroRoam.config.userSettings['override_quickcopy'] || false;
        if(qc_override_key){
            zoteroRoam.config.params.override_quickcopy.key = qc_override_key;
            window.addEventListener("keydown", (e) => {
                if(e.key == zoteroRoam.config.params.override_quickcopy.key | e[zoteroRoam.config.params.override_quickcopy.key] == true){
                    zoteroRoam.config.params.override_quickcopy.overridden = true;
                }
            });
            window.addEventListener("keyup", (e) => {
                if(e.key == zoteroRoam.config.params.override_quickcopy.key | e[zoteroRoam.config.params.override_quickcopy.key] == false){
                    zoteroRoam.config.params.override_quickcopy.overridden = false;
                }
            })
        };
        // always_copy | quick_copy_format
        let {always_copy = false, quick_copy_format = 'citekey'} = zoteroRoam.config.userSettings;
        zoteroRoam.config.params.always_copy = always_copy;
        zoteroRoam.config.params.quick_copy_format = quick_copy_format;

        if(zoteroRoam.config.userSettings.autocomplete){
            let {format = 'citation', trigger = '', display = 'citekey'} = zoteroRoam.config.userSettings.autocomplete;
            zoteroRoam.config.params.autocomplete.format = format;
            zoteroRoam.config.params.autocomplete.display = display;
            if(trigger.length > 0){
                zoteroRoam.config.tribute.trigger = trigger;
                zoteroRoam.config.params.autocomplete.enabled = true;
            }
        }

        if(zoteroRoam.config.userSettings.notes){
            let {use = "text", split_char = "\n", func = "zoteroRoam.utils.formatItemNotes"} = zoteroRoam.config.userSettings.notes;
            zoteroRoam.config.params.notes.use = use;
            zoteroRoam.config.params.notes["split_char"] = split_char;
            zoteroRoam.config.params.notes.func = func;
        }

        if(zoteroRoam.config.userSettings.pageMenu){
            if(zoteroRoam.config.userSettings.pageMenu.defaults){
                zoteroRoam.config.params.pageMenu.defaults = zoteroRoam.config.userSettings.pageMenu.defaults;
            }
        }
        
        zoteroRoam.shortcuts.setup();
        zoteroRoam.shortcuts.setupSequences();
        zoteroRoam.handlers.setupUserRequests();

        if(zoteroRoam.config.userSettings.autoload == true){
            setTimeout(function(){zoteroRoam.extension.load()}, 1000);
        }

    } else {
        throw new Error("A zoteroRoam_settings object must be defined in order to use the extension. Read through the docs for basic setup examples.");
    }
})();
