
/** @namespace */
var zoteroRoam = {};

;(()=>{

    zoteroRoam = {

        /** Represents a shortcut
         * @constructor
         * @memberof! zoteroRoam
         * @param {{action: string, template: Object<string, boolean>}} obj - The object describing the shortcut
         */
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

        /** Represents a paginated dataset
         * @constructor
         * @param {Object} obj - An object containing pagination settings
         * @param {Array} obj.data - The dataset to be paginated
         * @param {Integer} obj.itemsPerPage - The number of items for each page
         */
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
        
        version: "0.6.30",

        data: {items: [], collections: [], semantic: [], libraries: [], keys: []},
        
        librarySearch: {autocomplete: null},
        
        citations: {pagination: null, autocomplete: null, currentDOI: "", currentCitekey: "", currentType: "citations"},
        
        tagSelection: {autocomplete: null},
        
        config: {
            /** autoComplete configuration for the library search panel */
            autoComplete: {
                data: {
                    /** @returns {Array} The dataset in simplified format, if any data has been imported */
                    src: async function() {
                        let data = [];
                        if(zoteroRoam.data.items.length > 0){
                            data = zoteroRoam.handlers.simplifyDataArray(zoteroRoam.data.items);
                        }
                        return data;
                    },
                    keys: ['title', 'authorsString', 'year', 'tagsString', 'key', '_multiField'],
                    cache: false,
                    /** @returns {Array} The results, filtered in the order of the 'keys' parameter above, and sorted by authors ascending */
                    filter: (list) => {
                        // Make sure to return only one result per item in the dataset, by gathering all indices & returning only the first match for that index
                        // Records are sorted alphabetically (by key name) => _multiField should come last
                        const filteredMatches = Array.from(new Set(list.map((item) => item.value.key))).map((citekey) => {
                            return list.filter(item => item.value.key == citekey).sort((a,b) => {
                                return zoteroRoam.config.autoComplete.data.keys.findIndex(key => key == a.key) < zoteroRoam.config.autoComplete.data.keys.findIndex(key => key == b.key) ? -1 : 1;
                            })[0];
                        });
                        return filteredMatches.sort((a,b) => {
                            if(a.value.authors.length == 0){
                                return 2;
                            } else if(a.value.authors.toLowerCase() < b.value.authors.toLowerCase() || b.value.authors.length == 0){
                                return 0;
                            } else{
                                return 1;
                            }
                        })
                    }
                },
                selector: '#zotero-roam-search-autocomplete',
                wrapper: false,
                /** @returns {boolean} Indicates whether the search should be run */
                trigger: (query) => {
                    if(query.length == 0){
                        document.querySelector(".zotero-roam-library-results-count").innerHTML = ``;
                        return false;
                    } else {
                        return true;
                    }
                },
                searchEngine: (query, record) => {
                    return zoteroRoam.utils.multiwordMatch(query, record);
                },
                resultsList: {
                    class: "zotero-roam-search-results-list",
                    id: "zotero-roam-search-results-list",
                    destination: "#zotero-roam-library-search-div",
                    position: "beforeend",
                    maxResults: 100,
                    /**
                     * Controls the rendering of the results list
                     * @param {Element} list - The DOM Element corresponding to the results list 
                     * @param {object} data - The dataset containing the search results
                     */
                    element: (list, data) => {
                        list.classList.add("bp3-menu");
                        if(data.results && data.results.length > 0){
                            document.querySelector(".zotero-roam-library-results-count").innerHTML = `
                            <strong>${data.results.length}</strong> / ${data.matches.length} results
                            `;
                        }
                    }
                },
                resultItem: {
                    tag: 'li',
                    class: "zotero-roam-search_result",
                    id: "zotero-roam-search_result",
                    highlight: "result_highlighted",
                    /**
                     * Controls the rendering of each search result
                     * @param {Element} item - The DOM Element corresponding to a given search result 
                     * @param {object} data - The search data associated with a given result
                     */
                    element: (item, data) => {
                        let itemMetadata = `<span class="zotero-roam-search-item-metadata"> ${data.value.meta}</span>`;
                        let itemTitleContent = (data.key == "title") ? data.match : data.value.title;
                        let itemTitle = `<span class="zotero-roam-search-item-title" style="display:block;">${itemTitleContent}</span>`;
                        
                        let localTarget = data.value.location.startsWith("users") ? "library" : data.value.location;
                        let keyEl = `
                        <span class="bp3-menu-item-label zotero-roam-search-item-key">
                        <a href="zotero://select/${localTarget}/items/${data.value.itemKey}" destination="zotero">${data.value.key}</a>
                        </span>
                        `;

                        let itemYear = data.value.year ? ` (${data.value.year})` : "";
            
                        // Prepare authors element, if there are any
                        let itemAuthors = "";
                        if(data.value.authors){
                            // If the match is in the full list of authors, manually add the .result_highlighted class to the abbreviated authors span
                            if(data.key == "authorsString" || data.key == "year"){
                                itemAuthors = `<span class="zotero-roam-search-item-authors result_highlighted">${data.value.authors}${itemYear}</span>`;
                            } else {
                                itemAuthors = `<span class="zotero-roam-search-item-authors">${zoteroRoam.utils.renderBP3Tag(data.value.authors + itemYear, {modifier: "bp3-intent-primary"})}</span>`;
                            }
                        }
                        // Prepare tags element, if there are any
                        let itemTags = "";
                        if(data.value.tagsString){
                            let itemTagsContent = (data.key == "tagsString") ? data.match : data.value.tagsString;
                            itemTags = `<span class="zotero-roam-search-item-tags bp3-text-muted" style="display:block;">${itemTagsContent}</span>`;
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
                        blur: (event) => {},
                        focus: (event) => {
                            zoteroRoam.interface.clearSelectedItem();
                            zoteroRoam.librarySearch.autocomplete.start();
                        },
                        results: (event) => {
                            zoteroRoam.interface.clearSelectedItem();
                            if(event.detail.query.length > 0 && event.detail.results.length == 0){
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
            /** autoComplete configuration for the citations search panel */
            citationsSearch: {
                data: {
                    /** @returns {Array} The citations dataset in simplified format, if any DOI has been selected */
                    src: async function(){
                        if(zoteroRoam.citations.currentDOI.length == 0){
                            return [];
                        } else {
                            return zoteroRoam.data.semantic.find(it => it.doi == zoteroRoam.citations.currentDOI)[`${zoteroRoam.citations.currentType}`];
                        }
                    },
                    keys: ['year', 'title', 'authorsString', 'meta'],
                    /** @returns {Array} The results, filtered in the order of the 'keys' parameter above */
                    filter: (list) => {
                        // Make sure to return only one result per item in the dataset, by gathering all indices & returning only the first match for that index
                        const filteredMatches = Array.from(new Set(list.map((item) => item.value.doi))).map((doi) => {
                            return list.filter(item => item.value.doi == doi).sort((a,b) => {
                                return zoteroRoam.config.citationsSearch.data.keys.findIndex(key => key == a.key) < zoteroRoam.config.citationsSearch.data.keys.findIndex(key => key == b.key) ? -1 : 1;
                            })[0];
                        });
                        return filteredMatches;
                    }
                },
                selector: '#zotero-roam-citations-autocomplete',
                wrapper: false,
                /** @returns {boolean} Indicates whether the search should be run */
                trigger: (query) => {
                    if(query.length == 0){
                        zoteroRoam.interface.popCitationsOverlay(doi = zoteroRoam.citations.currentDOI, citekey = zoteroRoam.citations.currentCitekey, zoteroRoam.citations.currentType);
                        return false;
                    } else {
                        return true;
                    }
                },
                searchEngine: (query, record) => {
                    return zoteroRoam.utils.multiwordMatch(query, record)
                },
                resultsList: false,
                events: {
                    input: {
                        results: (event) => {
                            if(event.detail.results.length > 0){
                                zoteroRoam.citations.pagination = new zoteroRoam.Pagination({data: event.detail.results.map(res => res.value)});
                                zoteroRoam.interface.renderCitationsPagination();
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
            },
            /** autoComplete configuration for the tag selection in the 'Add to Zotero' side panel */
            tagSelection: {
                data: {
                    /** @returns The list of existing Roam pages, with an artificial entry for the current query in case it doesn't exist */
                    src: async function(query){
                        let roamPages = [];
                        if(zoteroRoam.interface.activeImport !== null){
                            roamPages = zoteroRoam.interface.activeImport.pages;
                        }
                        let hasQuery = roamPages.findIndex(p => p.title == query);
                        if(hasQuery == -1){
                            return [{title: query, identity: "self"}, ...roamPages];
                        } else {
                            roamPages[hasQuery].identity = "self";
                            return roamPages;
                        }
                    },
                    keys: ['title'],
                    /** @returns {Array} The list of existing Roam pages, with the current query always at the top */
                    filter: (list) => {
                        return list.sort((a,b) => {
                            if(a.value.identity == "self"){
                                return -1000;
                            } else {
                                return a.value.title.length - b.value.title.length;
                            }
                        })
                    }
                },
                selector: '#zotero-roam-tags-autocomplete',
                wrapper: false,
                /** @returns {boolean} Indicates whether the search should be run */
                trigger: (query) => {
                    if(query.length == 0){
                        /** Close the selection dropdown if the query is cleared from the searchbox */
                        zoteroRoam.tagSelection.autocomplete.close();
                        return false;
                    } else {
                        return true;
                    }
                },
                searchEngine: (query, record) => {
                    return zoteroRoam.utils.multiwordMatch(query, record);
                },
                placeHolder : "Add tags...",
                resultsList: {
                    class: "zotero-roam-import-tags-list",
                    id: "zotero-roam-import-tags-list",
                    maxResults: 20,
                    /**
                     * Controls the rendering of the results list
                     * @param {Element} list - The DOM Element corresponding to the results list 
                     * @param {object} data - The dataset containing the search results
                     */
                    element: (list, data) => {
                        list.classList.add("bp3-menu");
                        list.classList.add("bp3-elevation");
                        if(data.results.length > 0){
                            try{
                                zoteroRoam.tagSelection.autocomplete.goTo(0);
                            } catch(e){};
                        }
                    }
                },
                events: {
                    input: {
                        blur: (event) => {
                            zoteroRoam.interface.citations.overlay.querySelector(`${zoteroRoam.config.tagSelection.selector}`).value = ``;
                            zoteroRoam.tagSelection.autocomplete.close();
                        },
                        selection: (event) => {
                            let feedback = event.detail;
                            let selection = zoteroRoam.interface.citations.overlay.querySelector(".options-tags_selection");
                            selection.innerHTML += zoteroRoam.utils.renderBP3Tag(string = feedback.selection.value.title, {tagRemove: true, tagAttribute: `data-tag="${feedback.selection.value.title}"`});
                            let selectedTags = JSON.parse(selection.dataset.tags);
                            selectedTags.push(feedback.selection.value.title);
                            selection.dataset.tags = JSON.stringify(selectedTags);
                            document.querySelector(`${zoteroRoam.config.tagSelection.selector}`).value = "";
                        }
                    }
                }
            },
            /** tribute configuration for the inline tribute */
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
                },
                theme: ""
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
            .zotero-roam-search-backdrop, .zotero-roam-citations-search-backdrop {opacity:0.4;}
            .zotero-roam-dialog-overlay .bp3-dialog-container{justify-content:start;}
            .zotero-roam-dialog-overlay .bp3-dialog{margin-left: calc(20vw + 2.5%);padding-bottom:0px;box-shadow:none;}
            .zotero-roam-dialog-overlay .bp3-dialog[side-panel="hidden"]{width:calc(95% - 40vw);}
            .zotero-roam-dialog-overlay .bp3-dialog[side-panel="visible"]{width:calc(95% - 20vw);}
            .zotero-roam-dialog-overlay .bp3-dialog[side-panel="visible"] .side-panel{flex-basis:20vw!important;}
            .zotero-roam-dialog-overlay .bp3-dialog[side-panel="hidden"] .side-panel{flex-basis:0%;}
            .zotero-roam-dialog-overlay .bp3-dialog .side-panel-contents{width:20vw;}
            .zotero-roam-dialog-overlay .bp3-dialog .side-panel-contents .item-rendered-notes p{font-weight:350;}
            #zotero-roam-portal .bp3-dialog-body{flex-wrap:nowrap;display:flex;margin:0px;}
            #zotero-roam-portal .controls-top{display:flex;width:100%;justify-content:flex-end;}
            #zotero-roam-portal .header-content{width:97.5%;margin:0;margin-left:2.5%;display:flex;}
            .zotero-roam-dialog-overlay h5.panel-tt{font-weight:600;display:inline-block;padding-right:15px;}
            .zotero-roam-dialog-overlay h5.panel-tt[list-type="library"]{color:#137cbd;}
            .zotero-roam-dialog-overlay h5.panel-tt[list-type="citations"]{color:#d9822b;}
            .zotero-roam-dialog-overlay h5.panel-tt[list-type="references"]{color:#137cbd;}
            .bp3-dark.zotero-roam-dialog-overlay h5.panel-tt[list-type="library"]{color:#48aff0;}
            .bp3-dark.zotero-roam-dialog-overlay h5.panel-tt[list-type="citations"]{color:#ffb366;}
            .bp3-dark.zotero-roam-dialog-overlay h5.panel-tt[list-type="references"]{color:#48aff0;}
            #zotero-roam-portal .header-left{flex: 0 1 66%;padding-top:10px;}
            #zotero-roam-portal .header-right{flex: 0 1 34%;}
            .zotero-roam-search-close{margin:0;padding:0;min-width:41px;}
            #zotero-roam-portal .panel-st{padding-bottom:10px;display:inline-block;margin-bottom:0px;}
            #zotero-roam-search-autocomplete{width:100%;margin-bottom:20px;padding: 0px 10px;}
            #zotero-roam-search-autocomplete, #zotero-roam-citations-autocomplete{padding:0px 10px;}
            #zotero-roam-portal .quick-copy-element{margin:10px;font-weight:600;display:inline-block;}
            #zotero-roam-portal .bp3-dialog-footer-actions{margin:10px 2.5%;}
            #zotero-roam-portal .side-panel{background-color:white;transition:0.5s;font-size:0.8em;overflow:auto;border-radius: 0 6px 6px 0;}
            #zotero-roam-portal .bp3-dark .side-panel{background-color:#30404d;}
            #zotero-roam-portal .side-panel > .side-panel-contents > *{padding:10px 20px;}
            li[aria-selected="true"]{background-color:#e7f3f7;}
            .bp3-dark li[aria-selected="true"]{background-color:#191919;}
            span.result_highlighted{color:#146cb7;font-weight:500;}
            .zotero-roam-citations-search-overlay .main-panel{width:100%;}
            #zotero-roam-citations-pagination > .bp3-button-group{margin:5px 0;}
            #zotero-roam-search-results-list, .zotero-roam-citations-search-results-list {max-height:70vh;overflow-y:scroll;}
            .zotero-roam-search-item-title{font-weight:600;font-size:0.9em;}
            .zotero-roam-search-item-tags{font-style:italic;display:block;}
            .zotero-roam-citation-link{padding: 0 5px;}
            .zotero-roam-citation-link a, .zotero-roam-citation-metadata-contents{font-size:0.85em;}
            .zotero-roam-citations-results-count, .zotero-roam-library-results-count{padding: 6px 10px;color:#5c7080;}
            .bp3-dark .zotero-roam-citations-results-count, .zotero-roam-library-results-count{color:#95a8b7;}
            .zotero-roam-search-results-list.bp3-menu, .zotero-roam-citations-search-results-list.bp3-menu{padding:0px;}
            .zotero-roam-search_result, .zotero-roam-citations-search_result{padding:3px;}
            .zotero-roam-citations-search_result[in-library="true"]{background-color:#e9f7e9;}
            .zotero-roam-page-control > span[icon]{margin-right:0px;}
            #zotero-roam-library-rendered, #zotero-roam-citations-pagination {width:95%;margin: 0 auto;}
            #zotero-roam-library-rendered[view="search"] #zotero-roam-search-selected-item{display:none;}
            #zotero-roam-library-rendered[view="item"] #zotero-roam-library-search-div{display:none;}
            .selected-item-header, .selected-item-body{display:flex;justify-content:space-around;}
            .selected-item-header{margin-bottom:20px;}
            .selected-item-body{flex-wrap:wrap;}
            .item-basic-metadata, .item-additional-metadata{flex: 0 1 60%;}
            .item-abstract{padding:15px;background-color: #f5f8fa;font-weight:350;border-left-width:6px;}
            .bp3-dark .item-abstract{background-color:#191919;}
            .item-metadata-string{font-size:0.85em;}
            .item-pdf-notes{margin-top: 25px;}
            .item-actions-additional{flex: 0 1 95%;margin-top:25px;}
            .item-citekey-section, .item-actions{flex:0 1 30%;}
            .item-actions > .bp3-card{background-color: #eff8ff;box-shadow:none;}
            .bp3-dark .item-actions > .bp3-card{background-color:#2b3135;}
            .item-in-graph{padding: 0 10px;}
            .item-citekey-section{margin:10px 0px; overflow-wrap:break-word;}
            .item-citekey-section .citekey-element{font-weight:bold;padding:0 10px;}
            .item-citekey-section .copy-buttons .bp3-button{font-size:0.7em;flex-wrap:wrap;}
            a.item-go-to-page[disabled]{pointer-events:none;opacity:0.5;}
            span.zotero-roam-sequence{background-color:#c79f0c;padding:3px 6px;border-radius:3px;font-size:0.85em;font-weight:normal;color:white;}
            .zotero-roam-tribute {max-width:800px;max-height:300px;overflow:scroll;margin-top:5px;}
            .zotero-roam-tribute ul {list-style-type:none;padding:0px;background-color: white;border:1px #e4e4e4 solid; border-radius:2px;}
            .zotero-roam-tribute ul li {padding: 2px 5px;font-weight:300;}
            .zotero-roam-tribute-selected {background-color: #4f97d4;color:white;}
            .zotero-roam-page-doi{margin:10px;display:block;font-weight:600;letter-spacing:0.3mm;}
            .zotero-roam-page-menu{justify-content:space-between;border-width:0px;padding:10px;border-radius:5px;background-color: #f8f8f9;}
            .zotero-roam-page-menu-header{display:flex;}
            .zotero-roam-page-menu-actions{flex-wrap:wrap;}
            .zotero-roam-page-menu hr{margin:2px 0;}
            .scite-badge{padding-top:5px;min-width:25%;}
            .scite-badge[style*='position: fixed; right: 1%;'] {display: none!important;}
            .zotero-roam-page-menu-pdf-link, .item-pdf-link{font-weight:600;text-align:left!important;}
            .zotero-roam-page-menu-backlinks-list > ul{padding:1vw;}
            .zotero-roam-page-menu-backlinks-total, .zotero-roam-page-menu-references-total {font-weight: 700;}
            .zotero-roam-citations-search_result > .bp3-menu-item, .zotero-roam-search_result > .bp3-menu-item {flex-wrap:wrap;justify-content:space-between;}
            .zotero-roam-citations-search_result > .bp3-menu-item:hover{background-color:unset;cursor:unset;}
            .zotero-roam-citation-metadata, .zotero-roam-search-item-contents{flex: 0 2 77%;white-space:normal;}
            .zotero-roam-citation-links-list{display:block;}
            .zotero-roam-search-item-key{flex: 0 1 20%;text-align:right;}
            .zotero-roam-search-item-key .zotero-roam-citation-identifier-link {display:block;}
            .zotero-roam-search-item-key a, .zotero-roam-search-item-key button{font-size:0.8em;overflow-wrap:break-word;}
            .zotero-roam-citation-abstract{font-size:0.88em;font-weight:300;color:black;padding:3px 5px;flex:0 1 100%;background-color:#edf7ff;}
            .import-header{display:flex;justify-content:space-between;align-items:center;padding:10px 5px!important;margin-bottom:20px;}
            .import-options{display:flex;justify-content:space-between;flex-wrap:wrap;}
            .options-library-list, .options-collections-list{flex:1 0 50%;}
            .options-library-list label{font-weight:600;}
            .options-collections-list label{font-weight:400;}
            .options-tags{padding:20px 0px;flex: 1 0 100%;flex-wrap:wrap;display:flex;}
            .options-tags-select{flex: 1 0 50%;}
            .options-tags_selection{flex: 1 0 50%;padding:0px 8px;}
            #zotero-roam-tags-autocomplete{box-shadow:none;background:none;}
            #zotero-roam-import-tags-list{position:fixed;max-width:calc(20vw - 40px);z-index:20;border:1px #e1eeff solid;max-height:250px;overflow:scroll;}
            #zotero-roam-import-tags-list > li{padding:3px 5px;}
            li.import-items_selected, li.related-item_listed{display:flex;justify-content:space-between;background:#f9fafb;}
            .bp3-dark li.import-items_selected, .bp3-dark li.related-item_listed{background:#3e3e3e;}
            li.import-items_selected{padding:5px 0 5px 15px;}
            li.related-item_listed{padding:0 0 0 15px;}
            .selected_title{font-weight:500;}
            .selected_origin{display:block;font-weight:300;}
            .selected_info, .related_info{flex: 0 1 90%;}
            .related_info{display:flex;}
            .related_info > *{padding:6px 0px;font-size:0.9em;}
            .related_info .bp3-icon{margin-right:5px;}
            .selected_state, .related_state{flex: 1 0 10%;text-align:center;}
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
