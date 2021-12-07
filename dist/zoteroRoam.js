
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
         * @param {String} obj.render - The function to use to render results
         */
        Pagination: function(obj){
            this.data = obj.data;
            this.renderFunction = obj.render;
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
                this.renderResults();
            }

            this.nextPage = function(){
                this.currentPage += 1;
                if(this.currentPage > this.nbPages){ this.currentPage = this.nbPages};
                this.updateStartIndex();
                this.renderResults();
            }

            this.renderResults = function(){
                zoteroRoam.utils.executeFunctionByName(this.renderFunction, window);
            }
        },
        
        version: "0.6.91",

        data: {items: [], collections: [], semantic: new Map(), libraries: new Map(), keys: [], roamPages: [], tags: {}},
        
        librarySearch: {autocomplete: null},

        activeImport: {libraries: [], currentLib: {}},
        
        citations: {pagination: null, autocomplete: null, currentDOI: "", currentCitekey: "", currentType: "citations", activeImport: null},

        webImport: {currentBlock: null, activeImport: null},
        
        tagSelection: {cit_panel: null, aux_panel: null},

        tagManager: {lists: {}, pagination: null, activeDisplay: {library: null, by: 'alphabetical'}},
        
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
                        // Records are ranked (by key name) => _multiField should come last
                        var sortedMatches = list.sort((a,b) => {
                            return zoteroRoam.config.autoComplete.data.keys.findIndex(key => key == a.key) < zoteroRoam.config.autoComplete.data.keys.findIndex(key => key == b.key) ? -1 : 1;
                        });
                        // Make sure to return only one result per item in the dataset, by gathering all indices & returning only the first match for that index
                        var filteredMatches = Array.from(new Set(sortedMatches.map((item) => item.value.key))).map((citekey) => {
                            return sortedMatches.find(item => item.value.key == citekey);
                        });
                        return filteredMatches;
                    }
                },
                selector: '#zotero-roam-search-autocomplete',
                placeHolder: "Search by title, year, authors (last names), citekey, tags",
                wrapper: false,
                /** @returns {boolean} Indicates whether the search should be run */
                trigger: (query) => {
                    if(query.length == 0){
                        document.querySelector(".zotero-roam-library-results-count").innerHTML = ``;
                        document.getElementById('zotero-roam-library-rendered').removeAttribute('has-results');
                        return false;
                    } else {
                        return true;
                    }
                },
                searchEngine: (query, record) => {
                    return zoteroRoam.utils.multiwordMatch(query, record, highlight = [`<span class="zr-search-match">`, `</span>`]);
                },
                resultsList: {
                    class: "zotero-roam-search-results-list",
                    id: "zotero-roam-search-results-list",
                    destination: "#zotero-roam-library-search-div",
                    position: "beforeend",
                    maxResults: 100,
                    tabSelect: true,
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
                            list.closest('#zotero-roam-library-rendered').setAttribute('has-results', 'true');
                        }
                    }
                },
                resultItem: {
                    tag: 'li',
                    class: "zotero-roam-search_result",
                    id: "zotero-roam-search_result",
                    highlight: false,
                    /**
                     * Controls the rendering of each search result
                     * @param {Element} item - The DOM Element corresponding to a given search result 
                     * @param {object} data - The search data associated with a given result
                     */
                    element: (item, data) => {

                        let keyEl = ``;
                        if(data.value.inGraph){
                            item.setAttribute('in-graph', 'true');
                            keyEl = `<span class="bp3-icon bp3-icon-symbol-circle"></span>`;
                        } else {
                            item.setAttribute('in-graph', 'false');
                            keyEl = `<span class="bp3-icon bp3-icon-minus"></span>`;
                        }

                        item.setAttribute('data-item-type', data.value.itemType);

                        let {title, authors, publication} = data.value;
                        authors += (data.value.year ? ` (${data.value.year})` : "");

                        switch(data.key){
                            case "title":
                                title = data.match;
                                break;
                            case "authorsString":
                            case "year":
                                authors = `<span class="zr-search-match">${authors}</span>`;
                                break;
                            default:
                                break;
                        }
            
                        // Render the element's template
                        item.innerHTML = `
                        <div label="${data.value.key}" class="bp3-menu-item">
                            <div class="bp3-text-overflow-ellipsis zotero-roam-search-item-contents">
                            <span class="zotero-roam-search-item-title">${title}</span>
                                <span class="zr-details">
                                    <span class="zotero-roam-search-item-authors zr-highlight">${authors}</span><span class="zotero-roam-search-item-metadata zr-secondary"> ${publication}</span>
                                </span>
                            </div>
                            <span class="bp3-menu-item-label zotero-roam-search-item-key">
                            <span>@${data.value.key}</span>
                            ${keyEl}
                            </span>
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
                                document.getElementById('zotero-roam-library-rendered').removeAttribute('has-results');
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
                            let papersList = zoteroRoam.data.semantic.get(zoteroRoam.citations.currentDOI)[`${zoteroRoam.citations.currentType}`];
                            let doisInLib = new Map(zoteroRoam.data.items.filter(i => i.data.DOI).map(i => [zoteroRoam.utils.parseDOI(i.data.DOI), i.key]));
                            papersList.forEach((paper, i) => {
                                if(paper.doi && doisInLib.has(zoteroRoam.utils.parseDOI(paper.doi))){ 
                                    papersList[i].inLibrary = true;
                                    papersList[i].citekey = doisInLib.get(paper.doi)
                                }
                            });
                            return papersList;
                        }
                    },
                    keys: ['title', 'authorsString', 'year', 'meta'],
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
                placeHolder: "Search by title, year, authors (last names), publication",
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
                    return zoteroRoam.utils.multiwordMatch(query, record, highlight = [`<span class="zr-search-match">`, `</span>`])
                },
                resultsList: false,
                events: {
                    input: {
                        results: (event) => {
                            if(event.detail.results.length > 0){
                                zoteroRoam.citations.pagination = new zoteroRoam.Pagination({data: event.detail.results.map(res => res.value), render: 'zoteroRoam.interface.renderCitationsPagination'});
                                zoteroRoam.interface.renderCitationsPagination();
                            } else {
                                let paginationDiv = document.querySelector("#zotero-roam-citations-pagination");
                                paginationDiv.closest('.main-panel').querySelector(".zotero-roam-citations-results-count").innerHTML = `
                                <strong>No results</strong> for ${event.detail.query}
                                `;
                                zoteroRoam.citations.pagination = new zoteroRoam.Pagination({data: [], render: 'zoteroRoam.interface.renderCitationsPagination'});
                                let paginatedList = paginationDiv.querySelector("ul");
                                paginatedList.innerHTML = ``;
                            }
                        }
                    }
                }
            },
            /** Module for tag selector */
            tagSelection: (selector, index) => {
                return new autoComplete({
                    data: {
                        /** @returns The list of existing Roam pages, with an artificial entry for the current query in case it doesn't exist */
                        src: async function(query){
                            let roamPages = Array.from(zoteroRoam.data.roamPages.keys());
                            if(!roamPages.includes(query)){
                                roamPages.push(query);
                            };
                            return roamPages.map(p => {
                                if(p == query){
                                    return {
                                        title: p,
                                        identity: "self"
                                    }
                                } else {
                                    return {
                                        title: p
                                    }
                                }
                            });
                        },
                        keys: ['title'],
                        /** @returns {Array} The list of existing Roam pages, with the current query always at the top */
                        filter: (list) => {
                            return list.sort((a,b) => {
                                if(a.value.identity && a.value.identity == "self"){
                                    return -1000;
                                } else {
                                    return a.value.title.length - b.value.title.length;
                                }
                            })
                        }
                    },
                    wrapper: false,
                    selector: selector,
                    /** @returns {boolean} Indicates whether the search should be run */
                    trigger: (query) => {
                        if(query.length == 0){
                            /** Close the selection dropdown if the query is cleared from the searchbox */
                            zoteroRoam.tagSelection[`${index}`].close();
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
                                    zoteroRoam.tagSelection[`${index}`].goTo(0);
                                } catch(e){};
                            }
                        }
                    },
                    resultItem: {
                        class: "zotero-roam-tagselector_option"
                    },
                    events: {
                        input: {
                            blur: (event) => {
                                document.querySelector(`${selector}`).value = ``;
                                zoteroRoam.tagSelection[`${index}`].close();
                            },
                            selection: (event) => {
                                let feedback = event.detail;
                                let selection = document.querySelector(selector).closest('.options-tags').querySelector(".options-tags_selection");
                                selection.innerHTML += zoteroRoam.utils.renderBP3Tag(string = feedback.selection.value.title, {tagRemove: true, tagAttribute: `data-tag="${feedback.selection.value.title}"`});
                                let selectedTags = JSON.parse(selection.dataset.tags);
                                selectedTags.push(feedback.selection.value.title);
                                selection.dataset.tags = JSON.stringify(selectedTags);
                                document.querySelector(`${selector}`).value = "";
                            }
                        }
                    }
                });
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
                    itemsPerPage: 100
                },
                notes: {
                    use: "text",
                    split_char: "\n",
                    func: "zoteroRoam.utils.formatItemNotes"
                },
                pageMenu: {
                    defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb",
                            "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"],
                    trigger: (title) => {
                        return title.length > 3 ? true : false;
                    }
                },
                webimport: {
                    tags: []
                },
                theme: ""
            },
            requests: [], // Assigned the processed Array of requests (see handlers.setupUserRequests)
            shortcuts: [], // Assigned the processed Array of zoteroRoam.Shortcut objects (see shortcuts.setup)
            userSettings: {}, // Assigned the value of the zoteroRoam_settings Object defined by the user (see run.js)
            ref_checking: null,
            page_checking: null,
            tag_checking: null,
            auto_update: null,
            render_inline: null,
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
            let cssElem = document.createElement('style');
            cssElem.textContent = `
            #zotero-roam-portal .bp3-overlay-backdrop{opacity:0.4;}
            #zotero-roam-portal .bp3-dialog-body{flex-wrap:nowrap;display:flex;margin:0px;}
            #zotero-roam-portal .bp3-dialog-footer-actions{padding:5px 2.5%;justify-content:space-between;align-items:flex-end;transition:0.2s;}
            #zotero-roam-portal .side-panel{background-color:white;transition:0.5s;font-size:0.8em;overflow:auto;border-radius: 0 6px 6px 0;}
            #zotero-roam-portal [side-panel="hidden"] .side-panel{flex-basis:0%;}
            #zotero-roam-portal [side-panel="hidden"] .side-panel-contents{display: none;}
            #zotero-roam-portal .bp3-dark .side-panel{background-color:#30404d;}
            #zotero-roam-portal .side-panel > .side-panel-contents > *{padding:10px 20px;}
            .zotero-roam-dialog-overlay .bp3-dialog-container, .zotero-roam-dialog-small .bp3-dialog-container{justify-content:start;}
            .zotero-roam-search-overlay .bp3-dialog:not(.bp3-dark), .zotero-roam-citations-search-overlay .bp3-dialog:not(.bp3-dark){background:white;}
            .zotero-roam-dialog-overlay .bp3-dialog{margin-left: calc(20vw + 2.5%);padding-bottom:0px;box-shadow:none;}
            .zotero-roam-dialog-overlay [side-panel="hidden"]{width:calc(95% - 40vw);}
            .zotero-roam-dialog-overlay [side-panel="visible"]{width:calc(95% - 20vw);}
            .zotero-roam-dialog-overlay [side-panel="visible"] .side-panel{flex-basis:20vw!important;}
            .zotero-roam-citations-search-overlay .main-panel{width:100%;}
            .zotero-roam-dialog-overlay .bp3-dialog .side-panel-contents{width:20vw;}
            .zotero-roam-dialog-small .bp3-dialog{margin-left: calc(18vw + 9.5%);padding-bottom:0px;box-shadow:none;}
            .zotero-roam-dialog-small [side-panel="hidden"]{width:calc(55% - 10vw);}
            .zotero-roam-dialog-small [side-panel="visible"]{width:calc(50% + 8vw);}
            .zotero-roam-dialog-small [side-panel="visible"] .side-panel{flex-basis:18vw!important;}
            .zotero-roam-dialog-small .bp3-dialog .side-panel-contents{width:18vw;}
            #zotero-roam-portal .controls-top{display:flex;width:100%;justify-content:flex-end;font-weight:300;}
            #zotero-roam-portal .header-content{width:100%;margin:0;display:flex;flex-wrap:wrap;}
            h5.panel-tt{font-weight:600;display:inline-block;padding-right:15px;}
            h5.panel-tt[list-type="library"], h5.panel-tt[list-type="references"], .zr-search-scope{color:#137cbd;}
            h5.panel-tt[list-type="citations"]{color:#d9822b;}
            .bp3-dark h5.panel-tt[list-type="library"], .bp3-dark h5.panel-tt[list-type="references"], .bp3-dark .zr-search-scope{color:#48aff0;}
            .bp3-dark h5.panel-tt[list-type="citations"]{color:#ffb366;}
            #zotero-roam-portal .header-left{flex: 0 1 66%;padding-top:5px;padding-left:min(20px, 2vw);overflow-wrap:anywhere;}
            #zotero-roam-portal .header-left .bp3-spinner{width:fit-content;}
            #zotero-roam-portal .header-right{flex: 0 1 34%;}
            .zotero-roam-search-overlay .header-right {position:absolute;right:0px;}
            #zotero-roam-portal .zotero-roam-citations-search-overlay .header-bottom {margin-top:0px;}
            #zotero-roam-portal .header-bottom{flex: 1 0 95%;display:flex;justify-content:space-between;margin: min(20px, 3vh) 2.5%;align-items:baseline;}
            .zr-search-scope {font-weight:500;flex:1 0 auto;}
            .zotero-roam-overlay-close.bp3-large{margin-right:3px;}
            .zotero-roam-overlay-close{margin:0;padding:0;min-width:41px;}
            #zotero-roam-search-autocomplete{flex:0 1 89%;}
            #zotero-roam-citations-autocomplete{flex:1 0 100%;}
            #zotero-roam-search-autocomplete, #zotero-roam-citations-autocomplete{padding:0px 10px;box-shadow:none;}
            #zotero-roam-search-autocomplete::placeholder, #zotero-roam-citations-autocomplete::placeholder{opacity:0.6;}
            #zotero-roam-search-autocomplete:focus, #zotero-roam-citations-autocomplete:focus, #zotero-roam-tagselector_citations:focus{box-shadow:none;}
            :not(.bp3-dark) #zotero-roam-search-autocomplete, :not(.bp3-dark) #zotero-roam-citations-autocomplete{border-bottom: 1px #ececec solid;color: #717171;}
            .bp3-dark #zotero-roam-search-autocomplete, .bp3-dark #zotero-roam-citations-autocomplete{border-bottom: 1px #2f4d75 solid;}
            #zotero-roam-portal .quick-copy-element{margin:0px;font-weight:600;}
            #zotero-roam-portal .clipboard-copy-utility{width:10px;height:5px;padding:0px;}
            li[aria-selected="true"] > .bp3-menu-item, .zotero-roam-tagselector_option[aria-selected="true"]{background-color:#e7f3f7;}
            .bp3-dark li[aria-selected="true"]{background-color:#191919;}
            #zotero-roam-citations-pagination > .bp3-button-group{margin:5px 0;}
            #zotero-roam-search-results-list.bp3-menu, .zotero-roam-citations-search-results-list.bp3-menu {max-height:70vh;overflow-y:scroll;background:unset;padding:0px;padding-bottom:10px;}
            #zotero-roam-search-results-list::-webkit-scrollbar, .zotero-roam-citations-search-results-list::-webkit-scrollbar, .zotero-roam-import-tags-list::-webkit-scrollbar{width: 5px;}
            #zotero-roam-search-results-list::-webkit-scrollbar:hover, .zotero-roam-citations-search-results-list::-webkit-scrollbar:hover{background:#ececec;}
            .zotero-roam-search-item-title{font-weight:500;display:block;}
            .zotero-roam-citation-link{padding-right: 10px;}
            .zotero-roam-library-results-count:empty {padding: 0px;}
            .zotero-roam-library-results-count{display:block;padding:min(6px, 0.2em) 0;}
            .zotero-roam-citations-results-count {padding: 6px 10px;}
            .zotero-roam-search_result{padding:3px 0px;}
            .zotero-roam-citations-search_result{padding:3px 6px;}
            .zotero-roam-citations-search_result[in-library="true"]{background-color:#f3fdf3;border-left: 2px #a4f1a4 solid;}
            .bp3-dark .zotero-roam-citations-search_result[in-library="true"]{background-color:#5863582e;}
            .zotero-roam-page-control > span[icon]{margin-right:0px;}
            #zotero-roam-library-rendered, #zotero-roam-citations-pagination {width:97%;margin: 0 auto;}
            #zotero-roam-library-rendered[view="search"] #zotero-roam-search-selected-item, #zotero-roam-library-rendered[view="item"] #zotero-roam-library-search-div{display:none;}
            #zotero-roam-library-rendered[view="search"][has-results] + .bp3-dialog-footer-actions, #zotero-roam-citations-pagination + .bp3-dialog-footer-actions{box-shadow: 0px -4px 10px 0px #d6d6d6;}
            .bp3-dark #zotero-roam-library-rendered[view="search"][has-results] + .bp3-dialog-footer-actions, .bp3-dark #zotero-roam-citations-pagination + .bp3-dialog-footer-actions{box-shadow: 0px -4px 10px 0px #171717;}
            #zotero-roam-library-rendered[view="item"] + .bp3-dialog-footer-actions{opacity:0;}
            .selected-item-header, .selected-item-body{display:flex;justify-content:space-around;}
            .selected-item-body{flex-wrap:wrap;}
            .item-basic-metadata, .item-additional-metadata, .zotero-roam-citation-abstract{background:#f5f8fa;}
            .bp3-dark .item-basic-metadata, .bp3-dark .item-additional-metadata, .bp3-dark .zotero-roam-citation-abstract{background-color:#2b3135;}
            .item-basic-metadata, .item-additional-metadata{flex: 0 1 60%;padding: 20px;}
            .item-basic-metadata{padding-top:10px;}
            h4.item-title{margin-bottom:5px;}
            .item-citekey-section, .item-actions{flex:0 1 33%;}
            .item-abstract{padding:15px;border-top: 1px #e6e6e6 solid;border-bottom: 1px #e6e6e6 solid;}
            .bp3-dark .item-abstract{border-top-color: #4a4a4a;border-bottom-color: #4a4a4a;}
            .item-additional-metadata{padding-top:0px;}
            .item-additional-metadata p strong ~ span {margin:3px;}
            .item-pdf-notes, .item-actions-additional{margin-top: 25px;}
            .item-actions-additional{flex: 0 1 95%;}
            .item-actions > .bp3-card{background-color: #eff8ff;box-shadow:none;}
            .bp3-dark .item-actions > .bp3-card{background-color:#2b3135;}
            .item-citekey-section{margin:10px 0px; overflow-wrap:break-word;}
            .item-citekey-section .citekey-element{padding:0 10px;display:flex;align-items:baseline;overflow-wrap:anywhere;}
            .item-citekey-section .bp3-icon{margin-right:10px;}
            .copy-buttons > a.bp3-button{font-size:0.7em;margin:5px;}
            .copy-buttons > a.bp3-button, .copy-buttons > a.bp3-button:hover{border: 1px #f1f7ff solid;}
            .bp3-dark .copy-buttons > a.bp3-button, .bp3-dark .copy-buttons > a.bp3-button{border: 1px #2f4d75 solid;}
            .item-rendered-notes p{font-weight:350;}
            .zotero-roam-sequence{background-color:#c79f0c;padding:3px 6px;border-radius:3px;font-size:0.85em;font-weight:normal;color:white;}
            .controls-top .zotero-roam-sequence {background: unset;color: #c79f0c;}
            .zotero-roam-tribute {max-width:800px;max-height:300px;overflow:scroll;margin-top:5px;}
            .zotero-roam-tribute ul {list-style-type:none;padding:0px;background-color: white;border:1px #e4e4e4 solid; border-radius:2px;}
            .zotero-roam-tribute ul li {padding: 2px 5px;font-weight:300;}
            .zotero-roam-tribute-selected {background-color: #4f97d4;color:white;}
            .zotero-roam-page-doi{margin:10px;display:block;font-weight:600;letter-spacing:0.3mm;}
            .zotero-roam-page-menu{justify-content:space-between;border-width:0px;padding:5px;border-radius:5px;background-color: #f8f8f9;box-shadow:none;}
            .zotero-roam-page-menu-header{display:flex;}
            .zotero-roam-page-menu-actions{flex-wrap:wrap;flex: 1 1 auto;}
            .zotero-roam-page-menu hr{margin:2px 0;}
            .scite-badge{padding-top:5px;min-width:25%;}
            .scite-badge[style*='position: fixed; right: 1%;'] {display: none!important;}
            .zotero-roam-page-menu-actions.bp3-button-group .bp3-button {flex: 0 1 auto;}
            .zotero-roam-page-menu-pdf-link, .item-pdf-link{font-weight:600;text-align:left!important;}
            .zotero-roam-page-menu-citations{display:flex;padding:5px;flex-wrap:wrap;padding-bottom:0px;border-top: 1px #f1f1f1 solid;}
            .zotero-roam-page-menu-citations:empty{padding:0px;}
            .bp3-dark .zotero-roam-page-menu-citations{border-top-color:#f1f1f12e;}
            .zotero-roam-page-menu-citations > button{flex: 1 0 33%;}
            .zotero-roam-page-menu-backlinks-list {width:100%;display:flex;flex-direction:column;margin: 10px 0px;}
            .zotero-roam-page-menu-backlinks-total, .zotero-roam-page-menu-references-total {font-weight: 700;}
            .backlinks-list_divider{display: flex;align-items: center;margin: 10px 5px;}
            .backlinks-list_divider hr{flex: 0 1 100%;}
            .zotero-roam-search_result > .bp3-menu-item, .zotero-roam-citations-search_result > .bp3-menu-item {justify-content:space-between;user-select:initial;padding: 3px 10px;}
            .zotero-roam-citations-search_result > .bp3-menu-item:hover, .zotero-roam-list-item > .bp3-menu-item:hover{background-color:unset;cursor:unset;}
            .zotero-roam-citation-metadata, .zotero-roam-search-item-contents{flex: 0 1 97%;white-space:normal;}
            .zotero-roam-citation-links-list{display:block;}
            .zotero-roam-search-item-key{flex: 1 0 20%;text-align:right;overflow-wrap:anywhere;font-size:0.8em;}
            .zotero-roam-search-item-key .zotero-roam-citation-identifier-link {display:block;}
            .zotero-roam-search-item-key a, .zotero-roam-search-item-key button, .zotero-roam-list-item-actions button, .zotero-roam-list-item-actions a{overflow-wrap:break-word;}
            .zotero-roam-citation-toggle-abstract{font-size:0.8em;overflow-wrap:break-word;}
            .zotero-roam-citation-abstract, .item-abstract{white-space:break-spaces;}
            .zotero-roam-citation-abstract{padding:5px 10px;flex:0 1 100%;margin-top:5px;border-radius:5px;}
            .import-header{display:flex;justify-content:space-between;align-items:center;padding:10px 5px!important;margin-bottom:20px;}
            .import-options{display:flex;justify-content:space-between;flex-wrap:wrap;}
            .options-library-list, .options-collections-list{flex:1 0 50%;}
            .options-collections-list {max-height: 50vh;overflow-y:scroll;padding-top:2px;}
            .options-collections-list::-webkit-scrollbar {width:0.2em;}
            .options-collections-list label{font-weight:400;margin-left:40px;font-size:0.8em;margin-bottom:0px;}
            .options-collections-list label[data-option-depth="0"]{margin-left:0px;}
            .options-collections-list label[data-option-depth="1"]{margin-left:20px;}
            .options-library-list label{font-weight:600;}
            .options-tags{padding:20px 0px;flex: 1 0 100%;flex-wrap:wrap;display:flex;}
            .options-tags-select{flex: 1 0 50%;}
            .options-tags_selection{flex: 1 0 50%;padding:0px 8px;}
            .options-tags_selection .bp3-tag{word-break:break-word;}
            .zotero-roam-tags-autocomplete{box-shadow:none;background:none;}
            .zotero-roam-import-tags-list{position:fixed;max-width:calc(20vw - 40px);z-index:20;border:1px #e1eeff solid;max-height:250px;overflow:scroll;}
            .zotero-roam-import-tags-list > li{padding:3px 5px;}
            li.import-items_selected{display:flex;justify-content:space-between;background:#f9fafb;padding:5px 0 5px 15px;}
            .bp3-dark li.import-items_selected{background:#2e2f3187;}
            .selected_title{font-weight:500;}
            .selected_origin{display:block;font-weight:300;}
            .selected_info{flex: 0 1 90%;}
            .related-item_listed{display:flex;align-items:flex-start;padding:0px;}
            .related-sublist[list-type="references"] li:nth-child(even) {background-color:#e8f0ff;}
            .bp3-dark .related-sublist[list-type-"references"] li:nth-child(even) {background-color:#2d3a52;}
            .related-sublist[list-type="citations"] li:nth-child(even) {background-color:#fdfcf6;}
            .bp3-dark .related-sublist[list-type="citations"] li:nth-child(even) {background-color:#52452d;}
            .related-item_listed[item-type="reference"]:hover {background-color:#e1ecff;}
            .related-item_listed[item-type="citation"]:hover {background-color:#fff6e1;}
            .related_year, .related_info{font-size:0.9em;padding: 0px 0px 6px 10px;}
            .related_year{flex: 0 0 auto;}
            .related_info{line-height:normal;flex: 1 2 90%;}
            .related_info > *:not(.zotero-roam-search-item-title), .related_year{line-height:2em;}
            .related_state{flex: 1 0 auto;overflow-wrap:anywhere;}
            .related_state button.bp3-button{padding:0px 0px;}
            .related_state button.bp3-button, .related_state button.bp3-button:hover{border-radius:0px;}
            [in-graph="true"] .related_state {align-self:stretch;text-align:right;}
            [in-graph="true"] .related_state button {height:100%;}
            .selected_state{flex: 1 0 10%;text-align:center;}
            [item-type="reference"] .related_year, [item-type="reference"] a {color:#136fce!important;}
            .bp3-dark [item-type="reference"] .related_year, .bp3-dark [item-type="reference"] a {color:#3fb8ff!important;}
            .bp3-dark [item-type="citation"] .related_year, .bp3-dark [item-type="citation"] a {color:#bf7326!important}
            [item-type="citation"] .related_year, [item-type="citation"] a {color:#e09f26!important;}
            .zotero-roam-page-related{opacity:0.6;position:absolute;right:10px;top:10px;}
            .roam-log-page{position:relative;}
            .roam-body.mobile .zotero-roam-page-menu-header .scite-badge{margin:0 auto;}
            .roam-body.mobile + #zotero-roam-portal .quick-copy-element{display:none;}
            .roam-body.mobile + #zotero-roam-portal .bp3-dialog-footer-actions{flex-direction:column;align-items:center;}
            .bp3-dialog-footer-actions button.zotero-roam-update-data{margin-left:0px;}
            .zotero-roam-item-timestamp{margin-right:20px;}
            .zotero-roam-list-item .zotero-roam-item-contents{flex:0 1 100%;}
            .zotero-roam-list-item > .bp3-menu-item{flex-wrap:nowrap;user-select:initial;}
            .zotero-roam-list-item-actions{text-align:right;flex: 0 0 15%;}
            .zotero-roam-auxiliary-overlay .zotero-roam-list-item-actions button, .zotero-roam-auxiliary-overlay .zotero-roam-list-item-actions a{opacity:0.6;}
            .zotero-roam-list-item-key {padding:0 5px;}
            .zotero-roam-auxiliary-overlay .main-panel{padding:0px 10px;}
            .zotero-roam-auxiliary-overlay .main-panel ul.bp3-list-unstyled {padding:15px 0;}
            .zotero-roam-explo-import{position:absolute;right:0px;opacity:0.7;z-index:10;}
            .zr-explo-list-item .bp3-menu-item{flex-wrap:wrap;}
            .zr-explo-title{flex:1 0 100%;}
            .zr-explo-title .bp3-checkbox{margin-bottom:0px;}
            .zr-explo-publication, .zr-explo-abstract{display:block;white-space:break-spaces;}
            .zr-explo-list-item .zotero-roam-item-contents{padding-left:30px;}
            .zotero-roam-search-item-authors, .zotero-roam-citation-origin {padding-right: 8px;}
            .zotero-roam-dashboard-overlay .main-panel {display: flex;}
            .zotero-roam-dashboard-overlay .side-section, .zotero-roam-dashboard-overlay .main-section {padding:15px;}
            .zotero-roam-dashboard-overlay .side-section {flex: 1 0 20%;}
            .zotero-roam-dashboard-overlay .main-section {flex: 1 0 80%;}
            .zotero-roam-dashboard-overlay .side-section .bp3-tab-list {width: 100%;}
            .zotero-roam-dashboard .bp3-tab-panel {display: flex;flex-wrap: wrap;justify-content: space-between;margin-top: 0px;}
            .zr-tab-panel-toolbar {display: flex;align-items: baseline;padding: 10px 0px;justify-content: space-between;flex: 0 0 100%;flex-wrap: wrap;}
            .zr-tab-panel-toolbar > .bp3-button-group > .bp3-button, .zr-tab-panel-toolbar > .bp3-button-group > .bp3-button::before, .zr-tab-panel-toolbar > .bp3-control-group select {font-size: 0.9em;}
            .zr-tab-panel-toolbar {box-shadow: none;opacity:0.5;}
            .zr-tab-panel-datalist {flex: 0 0 100%;}
            [data-token]{background:white;padding:5px 10px;display:flex;border-bottom:1px #f5f5f5 solid;}
            [data-token]:last-child{border-bottom:1px white solid;}
            [data-token] .bp3-menu-item {justify-content:space-between;align-items:baseline;width:100%;}
            [data-token] [role="title"] {font-weight:600;margin-right:15px;}
            [data-token] [role="title"]::before {content: '# '}
            [data-token] [role="taglist"] {margin:5px;}
            [data-tag-source] {padding: 3px 8px;margin: 3px 5px;margin-left:0px;border-radius: 3px;display:inline-block;}
            [data-tag-source="zotero"] {color: #e1881a;background-color: #fff5e7;}
            [data-tag-source="roam"] {color: #48a5e7;background-color: #e7f5ff;}
            [data-token] .bp3-active {opacity:0.6;}
            [data-token]:hover .bp3-active {opacity:1;transition:0.3s;}
            .zr-highlight {color: #206fe6;}
            .bp3-dark .zr-highlight{color:#3fb8ff;}
            .zr-highlight-2 {color:#d9822b;}
            .zr-secondary {color: #7b7b7b;font-weight:300;}
            .zr-auxiliary{color:#5c7080;}
            .bp3-dark .zr-auxiliary{color:#95a8b7;}
            [in-graph='true'] .bp3-menu-item-label > *, [in-graph='true'] .citekey-element {color: #21b377;}
            [in-graph='false'] .bp3-menu-item-label .bp3-icon, [in-graph='false'] .citekey-element .bp3-icon {color: #F29D49;}
            .zr-search-match {background-color: #fbde0f40;padding: 2px;border-radius: 3px;}
            .zotero-roam-cm-option .bp3-menu-item, .zotero-roam-cm-option .bp3-menu-item::before {font-size: 0.95rem;}
            .zr-text-small, .zr-text-small .bp3-button[class*='bp3-icon-']::before {font-size:0.85em;}
            @media (max-width:600px){
                .zotero-roam-page-menu-header{flex-direction:column-reverse;}
                .zotero-roam-dialog-overlay .bp3-dialog, .zotero-roam-dialog-small .bp3-dialog{margin-left: calc(min(20vw, 30px) + 2.5%);padding-bottom:0px;box-shadow:none;}
                .zotero-roam-dialog-overlay .bp3-dialog[side-panel="hidden"], .zotero-roam-dialog-small .bp3-dialog[side-panel="hidden"]{width:calc(95% - min(40vw, 60px));}
                .zotero-roam-dialog-overlay .bp3-dialog[side-panel="visible"], .zotero-roam-dialog-small .bp3-dialog[side-panel="visible"]{width:calc(95% - min(20vw, 30px));}
                .zotero-roam-dialog-overlay .bp3-dialog[side-panel="visible"] .side-panel, .zotero-roam-dialog-small .bp3-dialog[side-panel="visible"] .side-panel{flex-basis:min(20vw, 30px)!important;}
                #zotero-roam-portal .bp3-dialog[side-panel="hidden"] .side-panel{flex-basis:0%;}
                .zotero-roam-dialog-overlay .bp3-dialog .side-panel-contents, .zotero-roam-dialog-small .bp3-dialog .side-panel-contents{width:min(20vw, 30px);}
                #zotero-roam-search-selected-item .item-citekey-section{margin:0px 0px;}
                #zotero-roam-search-selected-item .selected-item-header .copy-buttons{display:none;}
                #zotero-roam-search-selected-item .selected-item-header{flex-direction:column-reverse;}
                #zotero-roam-search-selected-item .selected-item-body{flex-direction:column;}
                .zotero-roam-page-menu-actions .bp3-button, .zotero-roam-page-menu-citations .bp3-button{font-size:0.85em;}
                .zotero-roam-citations-search_result > .bp3-menu-item{flex-direction:column;}
                .zotero-roam-citations-search_result .zotero-roam-citation-copy-doi, .zotero-roam-citations-search_result .zotero-roam-citation-add-import{display:none;}
                .zotero-roam-search-item-key{text-align:left;}
                .related_state{flex: 1 2 auto;}
            }
            `;
            document.head.append(cssElem);
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

        addBlock(uid, blockString, order = 0, opts = {}) {
            let blockUID = window.roamAlphaAPI.util.generateUID();
            let blockContents = {
                'string': blockString,
                'uid': blockUID
            }
            if(Object.keys(opts).length > 0){
                for(k of Object.keys(opts)){
                    if(['children-view-type', 'alignment', 'heading'].includes(k)){
                        blockContents[k] = opts[k];
                    }
                }
            }
            window.roamAlphaAPI.createBlock({ 'location': { 'parent-uid': uid, 'order': order }, 'block': blockContents });
            return blockUID;
        },

        categorizeTags(zdata, tagMap, rdata){
            let output = [];
          
            zdata = zdata.sort((a,b) => a > b ? -1 : 1);
            rdata = rdata.sort((a,b) => a.title > b.title ? -1 : 1);
          
            for(let elem of zdata){
              let in_table = output.findIndex(tk => zoteroRoam.utils.searchEngine(elem, tk.token, {match: "exact"}));
              let z_item = tagMap.get(elem)
              if(in_table == -1){
                output.push({
                  token: elem.toLowerCase(), 
                  zotero: z_item.constructor === Array ? z_item : [z_item], 
                  roam: []
                });
              } else {
                if(z_item.constructor === Array){
                  output[in_table].zotero.push(...z_item);
                } else {
                  output[in_table].zotero.push(z_item);
                }
              }
            }
          
            output = output.sort((a,b) => a.token < b.token ? -1 : 1);
          
            for(let elem of rdata){
              let in_table = output.findIndex(token => zoteroRoam.utils.searchEngine(elem.title, token.token, {match: "exact"}));
              if(in_table >= 0){
                output[in_table].roam.push(elem)
              }
            }
            return(output);
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

        findSameDay(date, {exclude_attachments = true} = {}){
            let fullArray = zoteroRoam.data.items.filter(it => new Date(it.data.dateAdded).toDateString() == date.toDateString());
            if(fullArray.length == 0){
                return [];
            } else if(exclude_attachments == true){
                return fullArray.filter(it => !["attachment", "annotation", "note"].includes(it.data.itemType));
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

        formatItemReference(item, format, {accent_class = "zr-highlight"} = {}){
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
                case 'inline':
                    return (item.meta.creatorSummary || ``) + (item.meta.parsedDate ? ` (${new Date(item.meta.parsedDate).getUTCFullYear()})` : ``);
                case 'zettlr':
                    return (item.meta.creatorSummary || ``) + (item.meta.parsedDate ? ` (${new Date(item.meta.parsedDate).getUTCFullYear()})` : ``) + ` : ` + item.data.title;
                case 'zettlr_accent':
                    let accented = `<span class="${accent_class}">` + (item.meta.creatorSummary || ``) + (item.meta.parsedDate ? ` (${new Date(item.meta.parsedDate).getUTCFullYear()})` : ``) + `</span>`;
                    return accented + ` : ` + item.data.title;
                case 'citekey':
                default:
                    return `@${item.key}`;
            }
        },

        getRoamPages(){
            return roamAlphaAPI.q(`[:find ?title ?uid :where[?e :node/title ?title][?e :block/uid ?uid]]`);
        },

        getAllRefPages(){
            return roamAlphaAPI.q(`[:find ?title ?uid :where[?e :node/title ?title][(clojure.string/starts-with? ?title "@")][?e :block/uid ?uid]]`);
        },

        getSelectPages(keys){
            return roamAlphaAPI.q(`[:find (pull ?e [:node/title :block/uid]) :in $ [?k ...] :where[?e :node/title ?title][(clojure.string/starts-with? ?title ?k)]]`, keys).flat(1);
        },

        getItemPrefix(item){
            return `${item.library.type}s/${item.library.id}`;
        },

        getLibraries(){
            return Array.from(zoteroRoam.data.libraries.values()).map(lib => {
                let keyAccess = zoteroRoam.data.keys.find(k => k.key == lib.apikey).access;
                let [libType, libID] = lib.path.split("/");
                let permissions = {};
                if(libType == "users"){
                    permissions = keyAccess.user || {};
                } else {
                    if(keyAccess.groups){
                        permissions = Object.keys(keyAccess.groups).includes(libID) ? keyAccess.groups[libID] : keyAccess.groups.all;
                    } else {
                        console.log(keyAccess); // For debugging (#13)
                    }
                }
                let collections = zoteroRoam.data.collections.filter(cl => zoteroRoam.utils.getItemPrefix(cl) == lib.path);
                // Sort collections by parent/child relationships
                collections = zoteroRoam.utils.sortCollectionsList(collections);
                let libName = collections.length > 0 ? collections[0].library.name : lib.path;
                return {
                    name: libName,
                    apikey: lib.apikey,
                    path: lib.path,
                    writeable: permissions.write || false,
                    collections: collections,
                    version: lib.version
                }
            })
        },

        includes_anycase(arr, str){
            return arr.join("\n").toLowerCase().split("\n").includes(str.toLowerCase());
        },

        lookForPage(title){
            let pageInfo = null;
            let pageSearch = window.roamAlphaAPI.q('[:find ?uid :in $ ?title :where[?p :node/title ?title][?p :block/uid ?uid]]', title);
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

        makeTimestamp(date){
            let d = date.constructor === Date ? date : new Date(date);
            return `${d.getHours()}:${('0' + d.getMinutes()).slice(-2)}`;
        },

        makeDictionary(arr){
            return arr.reduce((dict, elem) => {
              let initial = elem.charAt(0).toLowerCase();
              if(dict[initial]){
                dict[initial].push(elem);
              } else {
                dict[initial] = [elem];
              }
              return dict;
            }, {});
        },

        makeTagList(tagMap){
            let zdict = zoteroRoam.utils.makeDictionary(Array.from(tagMap.keys()));
            let zkeys = Object.keys(zdict).sort((a,b) => a < b ? -1 : 1);
          
            return zkeys.map(key => {
              let rdata = zoteroRoam.utils.getSelectPages(Array.from(new Set([key, key.toUpperCase()])));
              return zoteroRoam.utils.categorizeTags(zdict[key], tagMap, rdata);
            }).flat(1);
        },

        getTagUsage(token, {count_roam = true} = {}){
            return token.zotero.reduce((count, tag) => count += tag.meta.numItems, 0) + (count_roam ? token.roam.length : 0);
        },

        sortTagList(tagList, by = "alphabetical"){
            switch(by){
                case "usage":
                    return tagList.sort((a,b) => {
                        return zoteroRoam.utils.getTagUsage(a) > zoteroRoam.utils.getTagUsage(b) ? -1 : 1;
                    });
                case "roam":
                    return tagList.sort((a,b) => a.roam.length > b.roam.length ? -1 : 1);
                case "alphabetical":
                default:
                    return tagList;
            }
        },

        renderTagList(tagList = zoteroRoam.tagManager.pagination.getCurrentPageData()) {
            let datalist = document.querySelector('.zr-tab-panel-datalist[zr-panel="tag-manager"]');

            // TODO: Add detection of sort, then match with zoteroRoam.tagManager.activeDisplay.by
            // If discrepant, sort tagList and update zoteroRoam.tagManager.activeDisplay.by (and, at later stage, include the Pagination step)

            datalist.innerHTML = tagList.map(tk => {
                let is_singleton = tk.zotero.length == 1 && (tk.roam.length == 0 || (tk.roam.length == 1 && tk.zotero[0].tag == tk.roam[0].title));
                let label = tk.token;
                let elemList = ``;
                let primary_action = "Merge";
                let primary_icon = "git-merge";

                if (is_singleton) {
                    label = tk.zotero[0].tag;
                    primary_action = "Edit";
                    primary_icon = "edit";
                } else {
                    elemList = `
                  <div role="taglist" class="zr-text-small">
                  ${tk.roam.map(pg => `<span data-tag-source="roam" data-tag="${pg.title}" data-uid="${pg.uid}">${pg.title}</span>`).join("\n")}
                  ${tk.zotero.map(el => `<span data-tag-source="zotero" data-tag="${el.tag}" data-tag-type="${el.type || ''}">${el.tag} (${el.meta.numItems})</span>`).join("\n")}
                  </div>
                  `
                }

                return `
              <li role="option" class="zotero-roam-list-item" data-token="${tk.token}">
                <div class="bp3-menu-item">
                    <div style="flex:1 1 80%;">
                        <span role="title">${label}</span>
                        <span class="zr-auxiliary">${zoteroRoam.utils.getTagUsage(tk, { count_roam: false })} items</span>
                        ${elemList}
                    </div>
                    <span class="bp3-menu-item-label zotero-roam-list-item-key">
                        <div class="bp3-button-group bp3-minimal bp3-small bp3-active zr-text-small">
                            <a class="bp3-button bp3-intent-primary bp3-icon-${primary_icon}"><span class="bp3-button-text">${primary_action}</span></a>
                            <a class="bp3-button bp3-intent-danger"><span class="bp3-button-text">Delete</span></a>
                        </div>
                    </span>
                </div>
              </li>
              `;
            }).join("\n");
        },

        refreshTagLists(paths = Object.keys(zoteroRoam.data.tags)){
            paths.forEach(libPath => {
                let latest_lib = zoteroRoam.data.libraries.get(libPath).version;
                let latest_tagList = zoteroRoam.tagManager.lists[libPath].lastUpdated;
                if(Number(latest_lib) > Number(latest_tagList)){
                    // Only if the library's latest version has increased, refresh the tag list for that library
                    zoteroRoam.tagManager.lists[libPath].data = zoteroRoam.utils.makeTagList(zoteroRoam.data.tags[libPath]);
                    zoteroRoam.tagManager.lists[libPath].lastUpdated = latest_lib;
                }
            });
        },

        updateTagPagination(libPath, by = "alphabetical"){
            // Set parameters of active display
            zoteroRoam.tagManager.activeDisplay = {
                library: zoteroRoam.data.libraries.get(libPath),
                by: by
            }
            // Create a Pagination and render its contents
            zoteroRoam.tagManager.pagination = new zoteroRoam.Pagination({data: zoteroRoam.tagManager.lists[libPath].data, itemsPerPage: 50, render: 'zoteroRoam.utils.renderTagList'});
            zoteroRoam.tagManager.pagination.renderResults();
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

        readDNP(string){
            let [match, mm, dd, yy] = Array.from(string.matchAll(/(.+) ([0-9]+).{2}, ([0-9]{4})/g))[0];
            let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return new Date(parseInt(yy), months.findIndex(month => month == mm), parseInt(dd));
        },

        makeMetaString(item){
            let meta = "";
            let pubInfo = [item.data.publicationTitle, item.data.university, item.data.bookTitle].filter(Boolean);
            if(pubInfo.length > 0){
                meta += ` ${pubInfo[0]}`;
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
            meta = meta + (item.data.pages ? `, ${item.data.pages}.` : ".");

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

        matchArrays(arr1, arr2){
            return arr1.filter(el => arr2.includes(el)).length > 0;
        },

        multiwordMatch(query, string, highlight = []){
            let terms = Array.from(new Set(query.toLowerCase().split(" ").filter(Boolean)));
            let target = string.toLowerCase();
            
            let output = string;
            let finds = [];
        
            let match = false;
            for(let i = 0; i < terms.length; i++){
                let loc = target.search(terms[i]);
                if(loc >= 0){
                    match = true;
                    finds.push({loc: loc, end: loc + terms[i].length});
                } else {
                    match = false;
                    break;
                }
            }

            if(highlight.length == 2){
                let [prefix, suffix] = highlight;
                finds
                .sort((a,b) => (a.loc > b.loc ? -1 : 1))
                .forEach(find => {
                    output = output.substring(0, find.loc) + prefix + output.substring(find.loc, find.end) + suffix + output.substring(find.end);
                });
                output = output.replaceAll(`${suffix} ${prefix}`, " ");
            }
        
            if(match){ return output };
        
        },
        
        addToSidebar(uid, type = "outline"){
            window.roamAlphaAPI.ui.rightSidebar.addWindow({window:{'type': type, 'block-uid': uid}});
        },

        parseDOI(doi){
            if(!doi){
              return false;
            } else {
              // Clean up the DOI format if needed, to extract prefix + suffix only
                let formatCheck = doi.match(/10\.([0-9]+?)\/(.+)/g);
                if(formatCheck){
                    return formatCheck[0].toLowerCase();
                } else {
                    return false;
                }
            }
        },

        parseNoteBlock(block){
            let cleanBlock = block;
            let formattingSpecs = {
                "</p>": "",
                "</div>": "",
                "</span>": "",
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

        parseSemanticItem(item){
            let cleanItem = {
                doi: zoteroRoam.utils.parseDOI(item.doi),
                intent: item.intent,
                isInfluential: item.isInfluential,
                links: {},
                meta: item.venue.split(/ ?:/)[0], // If the publication has a colon, only take the portion that precedes it
                title: item.title,
                url: item.url || "",
                year: item.year ? item.year.toString() : ""
            }

            // Parse authors data
            cleanItem.authorsLastNames = item.authors.map(a => {
                let components = a.name.replaceAll(".", " ").split(" ").filter(Boolean);
                if(components.length == 1){
                    return components[0];
                } else {
                    return components.slice(1).filter(c => c.length > 1).join(" ");
                }
            });
            cleanItem.authorsString = cleanItem.authorsLastNames.join(" ");
            switch(cleanItem.authorsLastNames.length){
                case 0:
                    cleanItem.authors = "";
                    break;
                case 1:
                    cleanItem.authors = cleanItem.authorsLastNames[0];
                    break;
                case 2:
                    cleanItem.authors = cleanItem.authorsLastNames[0] + " & " + cleanItem.authorsLastNames[1];
                    break;
                case 3:
                    cleanItem.authors = cleanItem.authorsLastNames[0] + ", " + cleanItem.authorsLastNames[1] + " & " + cleanItem.authorsLastNames[2];
                    break;
                default:
                    cleanItem.authors = cleanItem.authorsLastNames[0] + " et al.";
            }
            if(item.paperId){
                cleanItem.links['semanticScholar'] = `https://www.semanticscholar.org/paper/${item.paperId}`;
            }
            if(item.arxivId){
                cleanItem.links['arxiv'] = `https://arxiv.org/abs/${item.arxivId}`;
            }
            if(item.doi){
                cleanItem.links['connectedPapers'] = `https://www.connectedpapers.com/api/redirect/doi/${item.doi}`;
                cleanItem.links['googleScholar'] = `https://scholar.google.com/scholar?q=${item.doi}`;
            }

            return cleanItem;
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
            <a role="button" class="bp3-button ${linkClass}" href="${target}" ${linkAttribute}>
            ${iconEl}
            <span class="bp3-button-text">${string}</span>
            </a>
            `;
        },

        renderBP3Button_group(string, {buttonClass = "", icon = "", modifier = "", buttonAttribute = ""} = {}){
            let iconEl = icon ? `<span icon="${icon}" class="bp3-icon bp3-icon-${icon} ${modifier}"></span>` : "";
            let textEl = string == "" ? "" : `<span class="bp3-button-text">${string}</span>`;
            return `
            <button type="button" class="bp3-button ${buttonClass}" ${buttonAttribute}>
            ${iconEl}
            ${textEl}
            </button>
            `;
        },

        renderBP3ButtonGroup(string, {divClass = "bp3-minimal bp3-fill bp3-align-left", buttonClass = "", modifier = "", icon = "", buttonModifier = ""} = {}){
            return `<div class="bp3-button-group ${divClass}">
                        ${zoteroRoam.utils.renderBP3Button_group(string = string, {buttonClass: buttonClass, icon: icon, modifier: modifier, buttonAttribute: buttonModifier})}
                    </div>`;
        },

        renderBP3_list(arr, type, {varName, has_value, has_string, optClass = "", selectFirst = false, active_if = ""} = {}){
            return arr.map((op, i) => {
                let mod = "";
                if(active_if){
                    mod = op[active_if] ? "" : "disabled";
                    optClass += op[active_if] ? "" : "bp3-disabled";
                }
                if(selectFirst && i == 0 && mod == ""){
                    mod = "checked";
                }
                return zoteroRoam.utils.renderBP3_option(string = op[has_string], type = type, depth = op.depth || 0, {varName: varName, optClass: optClass, modifier: mod, optValue: op[has_value]})
            }).join("\n");
        },

        renderBP3_option(string, type, depth, {varName, optClass = "", modifier = "", optValue = ""} = {}){
            return `
            <label class="bp3-control bp3-${type} ${optClass}" data-option-depth="${depth}">
                <input type="${type}" name="${varName}" value="${optValue}" ${modifier} />
                <span class="bp3-control-indicator"></span>
                ${string}
            </label>
            `;
        },
        
        renderBP3Tag(string, {modifier = "", icon = "", tagRemove = false, tagAttribute = ""} = {}){
            let tagRem = tagRemove ? `<button class="bp3-tag-remove"></button>` : "";
            if(icon.length > 0){
                return `<span class="bp3-tag bp3-minimal ${modifier}" ${tagAttribute}><span icon="${icon}" class="bp3-icon bp3-icon-${icon}"></span><span class="bp3-text-overflow-ellipsis bp3-fill">${string}</span>${tagRem}</span>`;
            } else {
                return `<span class="bp3-tag bp3-minimal ${modifier}" style="margin:3px;" ${tagAttribute}>${string}${tagRem}</span>`;
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

        // Inclusive search engine
        searchEngine(string, text, {any_case = true, word_order = "strict", match = "partial", search_compounds = true} = {}){
            let query = string;
            let target = text;
        
            // If search is case-insensitive, transform query & target to lowercase
            // Acronym RegExp was not functioning for tag management, retired it for now: !query.match(/[A-Z]{2}/g
            if(any_case == true){
                query = string.toLowerCase();
                target = text.toLowerCase();
            }
        
            // Is the query multi-word? Aka, has 1+ space(s) ?
            let queryWords = query.split(" ");
            let isHyphenated = false;
            queryWords.forEach(w => {
                if(w.includes("-")){ isHyphenated = true }
            });
        
            if(queryWords.length == 1){
                // Single-word query
                let searchString = query;
                if(isHyphenated && search_compounds == true){
                    // Replace hyphen by inclusive match (hyphen, space, nothing)
                    searchString = query.replace('-', '(?: |-)?');
                }
                // Then carry on with the search op
                if(match == "partial"){
                    let searchReg = new RegExp(zoteroRoam.utils.escapeRegExp(searchString), 'g');
                    return target.match(searchReg) ? true : false;
                } else if(match == "exact"){
                    let searchReg = new RegExp('^' + zoteroRoam.utils.escapeRegExp(searchString) + '$', 'g');
                    return target.match(searchReg) ? true : false;
                } else {
                    let searchReg = new RegExp('(?:\\W|^)' + zoteroRoam.utils.escapeRegExp(searchString) + '(?:\\W|$)', 'g');
                    return target.match(searchReg) ? true : false;
                }
            } else {
                // Multi-word query
                let searchArray = queryWords.map(w => zoteroRoam.utils.escapeRegExp(w));
                if(search_compounds == true){
                    if(isHyphenated){
                        // For each hyphenated term, replace hyphen by inclusive match (hyphen, space, nothing)
                        searchArray = searchArray.map(w => {
                            if(w.includes("-")){
                                return w.replace('-', '(?: |-)?');
                            } else {
                                return w;
                            }
                        });
                    } else if(!isHyphenated && word_order == "strict"){
                        // If strict mode :
                        // Join the search Array by inclusive match pattern (hyphen, space, nothing)
                        searchArray = [searchArray.join('(?: |-)?')]; // keeping Array form so that the logic can be the same later on       
                    }
                    // If loose mode :
                    // No special action necessary, should use searchArray = queryWords as defined above (default)
                }
                // If search_compounds == false :
                // No special action necessary, should use searchArray = queryWords as defined above (default)
        
                // Then carry on with the search op
                if(word_order == "loose"){
                    let searchArrayReg = searchArray.map(t => '(?:\\W|^)' + t + '(?:\\W|$)');
                    let match = true;
                    searchArrayReg.forEach(exp => {
                        let regex = new RegExp(exp, 'g');
                        if(!target.match(regex)){
                            match = false;
                            return;
                        }
                    });
                    return match;
                } else {
                    if(match == "exact"){
                        let searchReg = new RegExp('^' + searchArray.join(" ") + '$', 'g');
                        return target.match(searchReg) ? true : false;
                    } else {
                        let searchReg = new RegExp('(?:\\W|^)' + searchArray.join(" ") + '(?:\\W|$)', 'g');
                        return target.match(searchReg) ? true : false;
                    }
                }
            }
        
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
        },

        sortCollectionChildren(parent, children, depth = 0){
            let parColl = parent;
            parColl.depth = depth;
            if(children.length > 0){
                let chldn = children.filter(ch => ch.data.parentCollection == parColl.key);
                // If the collection has children, recurse
                if(chldn){
                    let collArray = [parColl];
                    // Go through each child collection 1-by-1
                    // If a child has children itself, the recursion should ensure everything gets added where it should
                    for(let j = 0; j < chldn.length; j++){
                        collArray.push(...zoteroRoam.utils.sortCollectionChildren(chldn[j], children, depth + 1));
                    }
                    return collArray;
                } else {
                    return [parColl];
                }
            } else {
                return [parColl];
            }
        },

        sortCollectionsList(arr){
            if(arr.length > 0){
                // Sort collections A-Z
                arr = arr.sort((a,b) => (a.data.name.toLowerCase() < b.data.name.toLowerCase() ? -1 : 1));
                let orderedArray = [];
                let topColls = arr.filter(cl => !cl.data.parentCollection);
                topColls.forEach((cl, i) => { topColls[i].depth = 0 });
                let childColls = arr.filter(cl => cl.data.parentCollection);
                for(k = 0; k < topColls.length; k++){
                    let chldn = childColls.filter(ch => ch.data.parentCollection == topColls[k].key);
                    // If the collection has children, pass it to sortCollectionChildren to recursively process the nested collections
                    if(chldn){
                        orderedArray.push(...zoteroRoam.utils.sortCollectionChildren(parent = topColls[k], children = childColls, depth = 0));
                    } else {
                        orderedArray.push(topColls[k]);
                    }
                };
                return orderedArray;
            } else {
                return [];
            }
        }

    };
})();

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
            let outcome = {};
            let citekey = title.replace("@", "");
            let item = zoteroRoam.data.items.find(i => i.key == citekey);

            let pageUID = uid || window.roamAlphaAPI.util.generateUID();
            let page = {title: title, uid: pageUID};
            if(pageUID != uid){
                window.roamAlphaAPI.createPage({'page': {'title': title, 'uid': pageUID}});
                page.new = true;
            } else {
                page.new = false;
            }
            let meta = null;

            if(item){
                let import_settings = zoteroRoam.config.userSettings.metadata || {};
                let import_type = import_settings.use || "function";
                switch(import_type){
                    case "smartblock":
                        let obj = import_settings.smartblock;
                        meta = {
                            config: obj,
                            context: {item: item, page: page}
                        }
                        outcome = await zoteroRoam.smartblocks.use_smartblock_metadata(config = obj, context = {item: item, page: page, uid: pageUID});
                        break;
                    case "function":
                    default:
                        let itemData = await zoteroRoam.handlers.formatData(item);
                        meta = itemData;
                        outcome = zoteroRoam.handlers.addMetadataArray(page_uid = pageUID, arr = itemData);
                        break;
                }

                let msg = outcome.success ? "Metadata was successfully added." : "The metadata couldn't be properly processed.";
                let intent = outcome.success ? "success" : "danger";
                if(popup == true){
                    zoteroRoam.interface.popToast(message = msg, intent = intent);
                } else {
                    console.log(msg);
                }

            } else {
                outcome.success = null;
                console.error(`Citekey ${citekey} yielded the following library item : ${item}`);
                zoteroRoam.interface.popToast(message = "Item could not be found in the library", intent = "danger");
            }
            zoteroRoam.events.emit('metadata-added', {
                success: outcome.success,
                uid: pageUID,
                title: title,
                item: item,
                meta: meta
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
                    // TODO: Harmonize this with the metadata-added events, to remove repeating code
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
        async fetchZoteroData(apiKey, dataURI, params){
            let requestURL = `https://api.zotero.org/${dataURI}?${params}`;
            let results = [];
            let req = null;

            try{
                // Make initial call to API, to know total number of results
                req = await fetch(requestURL, {method: 'GET', headers: {'Zotero-API-Version': 3,'Zotero-API-Key': apiKey}});

                if(req.ok == true){
                    let totalResults = req.headers.get('Total-Results');
                    let paramsQuery = new URLSearchParams(params);
                    let startIndex = Number(paramsQuery.get('start') || "0");
                    let limitParam = Number(paramsQuery.get('limit') || "100");

                    results = await req.json();

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
                    console.log(`The request for ${req.url} returned a code of ${req.status}`);
                }
            } catch(e) {
                console.error(e);
                zoteroRoam.interface.popToast("The extension encountered an error while requesting Zotero data. Please check the console for details.", "danger");
            } finally {
                return{
                    req: req,
                    data: results
                }
            }
        },

        async formatData(item) {
            let itemData = [];
            let type = item.data.itemType;
            let funcName = zoteroRoam.funcmap.DEFAULT;

            let import_settings = zoteroRoam.config.userSettings.metadata || {};
            let import_function = import_settings.func || false;
            if(import_function){
                funcName = import_function;
            } else if(zoteroRoam.config.userSettings.funcmap){
                // To be removed in v0.7
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
                libList.forEach((libPath, i) => {
                    zoteroRoam.data.libraries.set(libPath, {path: libPath, version: "0", apikey: requests.find(rq => rq.library == libPath).apikey});
                    zoteroRoam.tagManager.lists[libPath] = {data: [], lastUpdated: "0"}
                });
                zoteroRoam.config.requests = requests;
            }
        },

        async checkForSemantic_citations(refSpan){
            try {
                let citekey = refSpan.parentElement.dataset.linkTitle.replace('@', ""); // I'll deal with tags later, or not at all
                let item = zoteroRoam.data.items.find(i => i.key == citekey);
                if(item){
                    let itemDOI = zoteroRoam.utils.parseDOI(item.data.DOI);
                    if(itemDOI){
                        let semantic = await zoteroRoam.handlers.getSemantic(itemDOI);
                        if(semantic.citations){
                            if(semantic.citations.length == 0){
                                zoteroRoam.interface.popToast("This item has no available citing papers");
                            } else {
                                zoteroRoam.interface.popCitationsOverlay(itemDOI, citekey, type = "citations");
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
                    let itemDOI = zoteroRoam.utils.parseDOI(item.data.DOI);
                    if(itemDOI){
                        let semantic = await zoteroRoam.handlers.getSemantic(itemDOI);
                        if(semantic.references){
                            if(semantic.references.length == 0){
                                zoteroRoam.interface.popToast("This item has no available references");
                            } else {
                                zoteroRoam.interface.popCitationsOverlay(itemDOI, citekey, type = "references");
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

        async importSelectedItems(importDiv){

            let outcome = {};
            let type = importDiv.getAttribute('zr-import');

            // Retrieve import parameters
            let lib = zoteroRoam.activeImport.currentLib;
            let colls = Array.from(importDiv.querySelectorAll(`.options-collections-list [name="collections"]`)).filter(op => op.checked).map(op => op.value);
            let tags = importDiv.querySelector(".options-tags_selection").dataset.tags;
            tags = JSON.parse(tags);

            if(type == "citations"){
                let identifiers = zoteroRoam.citations.activeImport.items;
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
                        doi: zoteroRoam.citations.currentDOI,
                        key: zoteroRoam.citations.currentCitekey,
                        type: zoteroRoam.citations.currentType
                    }
                })
            } else if(type == "weblinks"){
                let items = zoteroRoam.webImport.activeImport.items;
                let identifiers = items.map(it => it.url);

                // Add in collections & tags
                items.forEach((item, j) => {
                    items[j].collections = colls;
                    items[j].tags = tags.map(t => { return {tag: t} });
                });
                outcome.harvest = items;

                // Write metadata to Zotero
                outcome.write = await zoteroRoam.write.importItems(items, lib);
                outcome.write.identifiers = identifiers;

                // Return outcome of the import process
                zoteroRoam.events.emit('write', {
                    collections: colls,
                    identifiers: identifiers,
                    library: lib,
                    tags: tags,
                    outcome: outcome,
                    context: {
                        block: zoteroRoam.webImport.currentBlock
                    }
                })
            }
            
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

        async getSemantic(doi){
            if(!zoteroRoam.data.semantic.has(doi)){
                let outcome = await zoteroRoam.handlers.requestSemantic(doi);
                if(outcome.success == true){
                    let doisInLib = zoteroRoam.data.items.map(it => zoteroRoam.utils.parseDOI(it.data.DOI)).filter(Boolean);
                    outcome.data.citations.forEach((cit, index) => {
                        if(cit.doi && zoteroRoam.utils.includes_anycase(doisInLib, cit.doi)){
                            outcome.data.citations[index].inLibrary = true;
                        }
                    });
                    outcome.data.references.forEach((ref, index) => {
                        if(ref.doi && zoteroRoam.utils.includes_anycase(doisInLib, ref.doi)){
                            outcome.data.references[index].inLibrary = true;
                        }
                    })
                    zoteroRoam.data.semantic.set(doi, outcome.data);
                } else {
                    console.log(outcome);
                    return {};
                }
            }
            
            return zoteroRoam.data.semantic.get(doi);
            
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
            let tagCalls = [];
            let tagResults = [];
            let collectionsCalls = [];
            let collectionsResults = [];
            let deletedCalls = [];
            let deletedResults = [];
            let currentLibs = Array.from(zoteroRoam.data.libraries.values());
            if(requests.length == 0){
                throw new Error("No data requests were added to the config object - check for upstream problems");
            }
            try{
                // Items data
                requests.forEach( rq => {
                    dataCalls.push(zoteroRoam.handlers.fetchZoteroData(apiKey = rq.apikey, dataURI = rq.dataURI, params = rq.params));
                });
                let requestsResults = await Promise.all(dataCalls);
                requestsResults = requestsResults.map( (res, i) => res.data.map(item => { 
                        item.requestLabel = requests[i].name; 
                        item.requestIndex = i; 
                        return item;
                })).flat(1);
                requestsResults = zoteroRoam.handlers.extractCitekeys(requestsResults);

                // Tags data
                currentLibs.forEach(lib => {
                    zoteroRoam.data.tags[`${lib.path}`] = new Map();
                    tagCalls.push(zoteroRoam.handlers.fetchZoteroData(lib.apikey, `${lib.path}/tags`, 'limit=100'));
                });
                tagResults = await Promise.all(tagCalls);

                tagResults.forEach((res, j) => {
                    res.data.reduce(
                        function(map,t){
                            if(map.has(t.tag)){
                                map.set(t.tag, [map.get(t.tag),t]);
                            } else{
                                map.set(t.tag,t)
                            } 
                            return map;
                        }, 
                        zoteroRoam.data.tags[`${currentLibs[j].path}`]);
                });
                
                // Collections data
                if(collections == true){
                    for(const lib of currentLibs){ collectionsCalls.push(zoteroRoam.handlers.fetchZoteroData(lib.apikey, `${lib.path}/collections`, `since=${lib.version}&limit=100`)) }
                    collectionsResults = await Promise.all(collectionsCalls);
                    
                    collectionsResults = collectionsResults.map(coll => {
                        let {req, data} = coll;
                        // Update version data for libraries
                        let latestVersion = req.headers.get('Last-Modified-Version');
                        let libPath = req.url.match(/(user|group)s\/([^\/]+)/g)[0];
                        if(latestVersion){ zoteroRoam.data.libraries.get(libPath).version = latestVersion }

                        return data;
                    }).flat(1);

                }
                // Deleted data
                if(update == true){
                    for(const lib of currentLibs){ deletedCalls.push(zoteroRoam.handlers.fetchZoteroData(lib.apikey, `${lib.path}/deleted`, `since=${lib.version}`)) }
                    deletedResults = await Promise.all(deletedCalls);

                    let toDelete = new Map(deletedResults.map(del => {
                        let {req, data} = del;
                        return [req.url.match(/(user|group)s\/([^\/]+)/g)[0], {items: data.items, collections: data.collections}];
                    }));
                    // Remove deleted items & collections from extension dataset
                    zoteroRoam.data.items = zoteroRoam.data.items.filter(it => !toDelete.get(zoteroRoam.utils.getItemPrefix(it)).items.includes(it.data.key));
                    zoteroRoam.data.collections = zoteroRoam.data.collections.filter(cl => !toDelete.get(zoteroRoam.utils.getItemPrefix(cl)).collections.includes(cl.key));
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
                    publication: `${item.data.publicationTitle || item.data.bookTitle || item.data.university || ""}`,
                    tags: item.data.tags.map(t => t.tag),
                    authorsFull: item.data.creators.map(c => {return (c.name) ? c.name : [c.firstName, c.lastName].filter(Boolean).join(" ")}),
                    authorsRoles: item.data.creators.map(c => c.creatorType),
                    authorsLastNames: item.data.creators.map(c => c.lastName || c.name),
                    authorsString: item.data.creators.map(c => c.lastName || c.name).join(" "),
                    tagsString: item.data.tags.map(i => `#${i.tag}`).join(", "),
                    location: zoteroRoam.utils.getItemPrefix(item),
                    itemType: item.data.itemType
                }

                simplifiedItem["_multiField"] = simplifiedItem.authorsString + " " + simplifiedItem.year + " " + simplifiedItem.title + " " + simplifiedItem.tagsString;
                simplifiedItem["inGraph"] = zoteroRoam.data.roamPages.has('@' + item.key) ? true : false;
        
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

        async postItemData(library, dataList) {
            let outcome = {};
            try {
                let req = await fetch(`https://api.zotero.org/${library.path}/items`,
                    {
                        method: 'POST',
                        body: JSON.stringify(dataList),
                        headers: { 'Zotero-API-Version': 3, 'Zotero-API-Key': library.apikey, 'If-Unmodified-Since-Version': library.version },
                    });
                if (req.ok == true) {
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

            } catch (e) {
                outcome = {
                    success: null,
                    error: e
                }
            } finally {
                return outcome;
            }
        },

        async editTags(library, tags, into) {
            let tagNames = Array.from(new Set(tags.map(t => t.tag)));
            let dataList = [];
            let libItems = zoteroRoam.data.items.filter(i => i.library.type + 's/' + i.library.id == library.path);
            libItems.forEach(i => {
                let itemTags = i.data.tags;
                if (itemTags.length > 0) {
                    // If the item already has the target tag, with type 0 (explicit or implicit) - remove it from the array before the filtering :
                    let has_clean_tag = itemTags.findIndex(i => i.tag == into && (i.type == 0 || !i.type));
                    if (has_clean_tag > -1) {
                        itemTags.splice(has_clean_tag, 1);
                    }
                    // Compare the lengths of the tag arrays, before vs. after filtering out the tags to be renamed
                    let cleanTags = itemTags.filter(t => !tagNames.includes(t.tag));
                    if (cleanTags.length < itemTags.length) {
                        // If they do not match (aka, there are tags to be removed/renamed), insert the target tag & add to the dataList
                        cleanTags.push({ tag: into, type: 0 });
                        dataList.push({
                            key: i.data.key,
                            tags: cleanTags
                        })
                    }
                }
            });

            return await zoteroRoam.write.postItemData(library, dataList);

        },

        async deleteTags(library, tags) {
            let tagList = tags.constructor === String ? encodeURIComponent(tags) : tags.map(t => encodeURIComponent(t)).join("||");
            let outcome = {};
            try {
                let req = await fetch(`https://api.zotero.org/${library.path}/tags?tag=${tagList}`,
                    {
                        method: 'DELETE',
                        headers: { 'Zotero-API-Version': 3, 'Zotero-API-Key': library.apikey, 'If-Unmodified-Since-Version': library.version }
                    });

                outcome = {
                    success: req.ok,
                    response: req
                }

            } catch (e) {
                outcome = {
                    success: null,
                    error: e
                }
            } finally {
                return outcome;
            }
        },

        // Not in use (playground)
        // TODO: Rewrite to support tag types
        async editItemTags(item, {add = [], remove = []} = {}){
            let currentTags = item.data.tags.map(t => t.tag);
            let newTags = currentTags.filter(t => !remove.includes(t)).push(...add).map(t => { return {tag: t} });

            let patchReq = await zoteroRoam.write.patchItemData(item, {tags: newTags});

            return patchReq;
        },

        // Not in use (playground)
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
;(()=>{
    zoteroRoam.interface = {
        icon: null,
        portal: {div: null, id: "zotero-roam-portal"},
        contextTarget: null,
        contextMenu: {
            div: null,
            class: "zotero-roam-context-menu",
            overlay: {div: null, class: "zotero-roam-context-overlay"},
            options: {list: [], class: "zotero-roam-context-menu-option", labels: ["View item information", "Add metadata", "Check for citing papers", "Convert to citation"]},
            visible: false,
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
            options: {list: [], class: "zotero-roam-icon-context-menu-option", labels: ["Update Zotero data", "Search in library"]},
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
            // Create small dialog overlay
            zoteroRoam.interface.createOverlay(divClass = "zotero-roam-auxiliary", dialogCSS = "align-self:start;transition:0.5s;", useBackdrop = true, commonTag = "zotero-roam-dialog-small");
            zoteroRoam.interface.fillAuxiliaryOverlay();
            // Create dashboard overlay
            zoteroRoam.interface.createOverlay(divClass = "zotero-roam-dashboard");
            zoteroRoam.interface.fillDashboardOverlay();
            // Create toast overlay
            zoteroRoam.interface.createToastOverlay();
        },

        setup(){
            zoteroRoam.interface.icon.addEventListener("click", zoteroRoam.extension.toggle);

            zoteroRoam.interface.setupContextMenus(["contextMenu", "iconContextMenu"]);

            zoteroRoam.interface.search.updateButton.addEventListener("click", function(){zoteroRoam.extension.update(popup = true)});

            document.addEventListener("click", (e) => {
                if(e.target.closest('.zotero-roam-page-div') || e.target.closest('.zotero-roam-page-related') || e.target.closest('.zotero-roam-explo-import')){
                    zoteroRoam.inPage.handleClicks(e.target);
                } else if(e.target.closest('.zotero-roam-overlay-close') || e.target.closest('.bp3-overlay-backdrop')){
                    let overlay = e.target.closest('.zotero-roam-dialog-overlay') || e.target.closest('.zotero-roam-dialog-small');
                    if(overlay){
                        if(overlay.classList.contains('zotero-roam-citations-search-overlay')){
                            zoteroRoam.interface.closeCitationsOverlay();
                        } else if(overlay.classList.contains('zotero-roam-search-overlay')){
                            zoteroRoam.interface.toggleSearchOverlay("hide");
                        } else if(overlay.classList.contains('zotero-roam-auxiliary-overlay')){
                            zoteroRoam.interface.closeAuxiliaryOverlay();
                        }
                    }
                } else if(e.target.closest('.item-actions button')){
                    let btn = e.target.closest('button');
                    let uid = btn.getAttribute('data-uid');
                    let itemKey = '@' + btn.getAttribute('data-citekey');
                    if(btn.classList.contains('item-go-to-page') && uid){
                        console.log(`Navigating to ${itemKey} (${uid})`);
                        roamAlphaAPI.ui.mainWindow.openPage({page: {uid: uid}});
                    } else if(btn.classList.contains('item-add-metadata')){
                        console.log("Importing metadata...");
                        zoteroRoam.handlers.importItemMetadata(itemKey, uid, {popup: true});
                    }
                } else if(e.target.closest('.item-additional-metadata')){
                    let refLink = e.target.closest('[data-link-uid]');
                    let tagLink = e.target.closest('[data-tag]');
                    if(refLink){
                        window.roamAlphaAPI.ui.mainWindow.openPage({page: {uid: refLink.getAttribute('data-link-uid')}});
                    } else if(tagLink){
                        window.roamAlphaAPI.ui.mainWindow.openPage({page: {title: tagLink.getAttribute('data-tag')}});
                    }
                } else if(e.target.closest('[zr-import]')){
                    zoteroRoam.interface.handleImportPanelClicks(e);
                }
            })
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
            let menuOptions = config.options.labels.map(op => {
                let icon = '';
                let intent = '';
                let divider = '';
                switch(op){
                    case "Add metadata":
                        icon = 'bp3-icon-add';
                        intent = 'bp3-intent-primary'
                        break;
                    case "View item information":
                        icon = 'bp3-icon-info-sign';
                        break;
                    case "Check for citing papers":
                        icon = 'bp3-icon-chat';
                        intent = 'bp3-intent-warning';
                        break;
                    case "Convert to citation":
                        divider = `<li class="bp3-menu-divider"></li>`;
                        break;
                    case "Update Zotero data":
                        icon = 'bp3-icon-refresh';
                        break;
                    case "Search in library":
                        icon = 'bp3-icon-search';
                        break;
                }
                return `
                ${divider}
                <li class="${config.options.class} zotero-roam-cm-option">
                    <a class="bp3-menu-item bp3-popover-dismiss ${icon} ${intent}">
                        <div class="bp3-fill bp3-text-overflow-ellipsis">${op}</div>
                    </a>
                </li>`;
            }).join("");

            var overlayDiv = document.createElement("div");
            overlayDiv.classList.add("bp3-overlay");
            overlayDiv.classList.add("bp3-overlay-open");
            overlayDiv.classList.add(`${config.overlay.class}`);
            overlayDiv.style = `display:none;`;
            overlayDiv.innerHTML = `
            <div class="bp3-overlay-backdrop bp3-popover-backdrop bp3-popover-appear-done bp3-popover-enter-done" style="${backdropStyle}"></div>
            <div class="bp3-transition-container bp3-popover-appear-done bp3-popover-enter-done ${config.class}" style="${containerStyle}">
                <div class="bp3-popover bp3-minimal ${zoteroRoam.config.params.theme ? zoteroRoam.config.params.theme : ""}">
                    <div class="bp3-popover-content">
                        <div>
                            <ul class="bp3-menu">
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
            toastOverlay.setAttribute('role', 'alert');

            toastOverlay.querySelector('.bp3-toast').style.opacity = "1";
            await zoteroRoam.utils.sleep(700);
            toastOverlay.querySelector('.bp3-toast').style.top = "-100px";
            toastOverlay.removeAttribute('role');

        },

        createOverlay(divClass, dialogCSS = "align-self:baseline;transition:0.5s;", useBackdrop = true, commonTag = "zotero-roam-dialog-overlay"){
            try{ document.querySelector(`.${divClass}-overlay`).remove() } catch(e){};

            let overlay = document.createElement("div");
            overlay.classList.add("bp3-overlay");
            overlay.classList.add("bp3-overlay-open");
            overlay.classList.add("bp3-overlay-scroll-container");
            overlay.classList.add(`${divClass}-overlay`);
            if(commonTag){ overlay.classList.add(commonTag) };
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
            if(zoteroRoam.config.params.theme){ dialogDiv.classList.add(zoteroRoam.config.params.theme) };
            dialogDiv.setAttribute("side-panel", "hidden");
            dialogDiv.setAttribute('role', 'dialog');
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

        fillAuxiliaryOverlay(){
            let dialogMainPanel = document.querySelector('.zotero-roam-auxiliary-overlay .bp3-dialog-body .main-panel');
            let dialogSidePanel = document.querySelector(`.zotero-roam-auxiliary-overlay .bp3-dialog-body .side-panel-contents`);

            let dialogCard = document.createElement('div');

            let headerContent = document.createElement('div');
            headerContent.classList.add("bp3-input-group");
            headerContent.classList.add("header-content");

            let headerLeft = document.createElement('div');
            headerLeft.classList.add("header-left");
            
            // ARIA Labelling
            dialogMainPanel.closest('[role="dialog"]').setAttribute('aria-labelledby', 'zr-related-dialogtitle');

            let headerRight = document.createElement('div');
            headerRight.classList.add("header-right");

            let controlsTop = document.createElement('div');
            controlsTop.classList.add("controls-top");
            controlsTop.classList.add("zr-auxiliary");
            controlsTop.innerHTML = `
            <button type="button" aria-label="Close" class="zotero-roam-overlay-close bp3-button bp3-minimal bp3-dialog-close-button">
            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>
            `;

            headerRight.appendChild(controlsTop);
            
            headerContent.appendChild(headerLeft);
            headerContent.appendChild(headerRight);

            let renderedDiv = document.createElement('div');
            renderedDiv.classList.add("rendered-div");
            renderedDiv.style = `width:96%;margin:0 auto;`;

            dialogCard.appendChild(headerContent);
            dialogCard.appendChild(renderedDiv);

            dialogMainPanel.appendChild(dialogCard);

            let importHeader = document.createElement('div');
            importHeader.classList.add("import-header");
            importHeader.innerHTML = `
            ${zoteroRoam.utils.renderBP3Button_group("Add to Zotero", {buttonClass: "bp3-minimal bp3-intent-primary", icon: "inheritance", buttonAttribute: 'disabled role="add" style="font-weight:600;"'})}
            `;

            let importOptions = document.createElement('div');
            importOptions.classList.add("import-options");

            let optionsLib = document.createElement('div');
            optionsLib.classList.add("options-library-list");

            let optionsColl = document.createElement('div');
            optionsColl.classList.add("options-collections-list");

            let optionsTags = document.createElement('div');
            optionsTags.classList.add("options-tags");

            let tagsSelect = document.createElement('div');
            tagsSelect.classList.add("options-tags-select");
            tagsSelect.classList.add("bp3-input-group");
            tagsSelect.classList.add("bp3-small");

            let tagsIcon = document.createElement('span');
            tagsIcon.classList.add("bp3-icon");
            tagsIcon.classList.add("bp3-icon-tag");
            tagsIcon.classList.add("bp3-intent-primary");

            let tagsSearchBar = document.createElement('input');
            tagsSearchBar.id = "zotero-roam-tagselector_auxiliary";
            tagsSearchBar.tabIndex = "1";
            tagsSearchBar.type = "text";
            tagsSearchBar.classList.add("zotero-roam-tags-autocomplete");
            tagsSearchBar.classList.add("bp3-input");
            tagsSearchBar.classList.add("bp3-fill");
            tagsSearchBar.setAttribute("autocomplete", "off");

            let tagsSelection = document.createElement('div');
            tagsSelection.classList.add("options-tags_selection");
            tagsSelection.setAttribute("data-tags", "[]");

            tagsSelect.appendChild(tagsIcon);
            tagsSelect.appendChild(tagsSearchBar);

            optionsTags.appendChild(tagsSelect);
            optionsTags.appendChild(tagsSelection);

            importOptions.appendChild(optionsLib);
            importOptions.appendChild(optionsColl);
            importOptions.appendChild(optionsTags);

            // Attribute a role to the side panel
            dialogSidePanel.setAttribute('zr-import', 'weblinks');

            dialogSidePanel.appendChild(importHeader);
            dialogSidePanel.appendChild(importOptions);

            dialogMainPanel.addEventListener("click", function(e){
                let btn = e.target.closest('button');
                if(btn){
                    if(btn.classList.contains('zotero-roam-citation-toggle-abstract')){
                        // Toggles for abstracts
                        let toggleText = btn.querySelector('.bp3-button-text');
                        let abstractSpan = btn.closest('.zotero-roam-list-item').querySelector('.zotero-roam-citation-abstract');
                        if(abstractSpan.style.display == "none"){
                            abstractSpan.style.display = "block";
                            toggleText.innerHTML = `Hide Abstract`;
                        } else {
                            abstractSpan.style.display = "none";
                            toggleText.innerHTML = `Show Abstract`;
                        }
                    } else if(btn.classList.contains('zotero-roam-add-to-graph')){
                        let itemKey = btn.closest('.bp3-menu-item').getAttribute('label');
                        console.log("Importing metadata...");
                        zoteroRoam.handlers.importItemMetadata(title = '@' + itemKey, uid = "", {popup: true});
                    } else if(btn.classList.contains('zotero-roam-list-item-go-to-page')){
                        let itemKey = btn.getAttribute('data-citekey');
                        let pageUID = btn.getAttribute('data-uid');
                        if(pageUID){
                            console.log(`Navigating to @${itemKey} (${pageUID})`);
                            zoteroRoam.interface.closeAuxiliaryOverlay();
                            roamAlphaAPI.ui.mainWindow.openPage({page: {uid: pageUID}});
                        }
                    }
                } else {
                    let chck = e.target.closest('input[type="checkbox"]');
                    if(chck && chck.getAttribute('name') == 'selectAll'){
                        // WebImport : select all
                        let status = chck.checked;
                        let webLinks = Array.from(document.querySelectorAll('.zotero-roam-auxiliary-overlay [name="explo-weblink"]'));
                        webLinks.forEach(lk => {
                            lk.checked = status;
                        });
                        zoteroRoam.interface.triggerImport(type = "weblinks");
                    } else if(chck && chck.getAttribute('name') == 'explo-weblink'){
                        // WebImport : item checkboxes
                        zoteroRoam.interface.triggerImport(type = "weblinks");
                    }

                }

            });

        },

        fillSearchOverlay(divClass = zoteroRoam.interface.search.overlayClass){
            let dialogMainPanel = document.querySelector(`.${divClass}-overlay .bp3-dialog-body .main-panel`);

            let headerContent = document.createElement('div');
            headerContent.classList.add("bp3-input-group");
            headerContent.classList.add("header-content");

            // Header (right)

            let headerRight = document.createElement('div');
            headerRight.classList.add("header-right");

            let controlsTop = document.createElement('div');
            controlsTop.classList.add("controls-top");
            controlsTop.classList.add("zr-auxiliary");
            controlsTop.innerHTML = `
            <button type="button" aria-label="Close" class="zotero-roam-overlay-close bp3-button bp3-minimal bp3-dialog-close-button bp3-large">
            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>
            `;

            headerRight.appendChild(controlsTop);

            let headerBottom = document.createElement('div');
            headerBottom.classList.add("header-bottom");

            let searchScope = document.createElement('span');
            // ARIA Labelling
            searchScope.id = "zr-library-search-dialogtitle";
            dialogMainPanel.closest('[role="dialog"]').setAttribute('aria-labelledby', 'zr-library-search-dialogtitle');
            
            searchScope.classList.add("zr-search-scope");
            searchScope.innerHTML = `Zotero library <span class="bp3-icon bp3-icon-chevron-right"></span>`;

            let searchBar = document.createElement('input');
            searchBar.id = "zotero-roam-search-autocomplete";
            searchBar.tabIndex = "1";
            searchBar.type = "text";
            searchBar.classList.add("bp3-input");

            headerBottom.appendChild(searchScope);
            headerBottom.appendChild(searchBar);
            
            // ---
            
            headerContent.appendChild(headerRight);
            headerContent.appendChild(headerBottom);

            dialogMainPanel.appendChild(headerContent);

            // ---

            let renderedDiv = document.createElement('div');
            renderedDiv.id = "zotero-roam-library-rendered";
            renderedDiv.setAttribute("view", "search");

            let librarySearchDiv = document.createElement('div');
            librarySearchDiv.id = "zotero-roam-library-search-div";
        
            let selectedItemDiv = document.createElement('div');
            selectedItemDiv.id = "zotero-roam-search-selected-item";
        
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
            <div>
                <span class="zotero-roam-library-results-count zr-auxiliary"></span>
                <label class="bp3-control bp3-switch bp3-text-small quick-copy-element">
                <input id="zotero-roam-quick-copy-mode" type="checkbox">
                <span class="bp3-control-indicator"></span>
                Quick Copy
            </label>
            </div>
            <input class="bp3-input clipboard-copy-utility bp3-small" type="text" readonly style="opacity:0;">
            <span class="bp3-popover2-target" tabindex="0">
                <button type="button" class="zotero-roam-update-data bp3-button bp3-minimal bp3-small">
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
            zoteroRoam.interface.search.closeButton = document.querySelector(`.${divClass}-overlay button.zotero-roam-overlay-close`);
            zoteroRoam.interface.search.updateButton = document.querySelector(`.${divClass}-overlay button.zotero-roam-update-data`);
        },

        fillCitationsOverlay(divClass = zoteroRoam.interface.citations.overlayClass){
            let dialogMainPanel = document.querySelector(`.${divClass}-overlay .bp3-dialog-body .main-panel`);
            let dialogSidePanel = document.querySelector(`.${divClass}-overlay .bp3-dialog-body .side-panel-contents`);
            
            let headerContent = document.createElement('div');
            headerContent.classList.add("bp3-input-group");
            headerContent.classList.add("header-content");

            // Header (left)
            let headerLeft = document.createElement('div');
            headerLeft.classList.add("header-left");

            let panelTitle = document.createElement('h5');
            // ARIA Labelling
            panelTitle.id = 'zr-citations-search-dialogtitle';
            dialogMainPanel.closest('[role="dialog"]').setAttribute('aria-labelledby', 'zr-citations-search-dialogtitle');
            
            panelTitle.classList.add("panel-tt");
            panelTitle.innerText = "Citing Papers";
            
            headerLeft.appendChild(panelTitle);

            // Header (right)
            let headerRight = document.createElement('div');
            headerRight.classList.add("header-right");

            let controlsTop = document.createElement('div');
            controlsTop.classList.add("controls-top");
            controlsTop.classList.add("zr-auxiliary");
            controlsTop.innerHTML = `
            <button type="button" aria-label="Close" class="zotero-roam-overlay-close bp3-button bp3-minimal bp3-dialog-close-button">
            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>
            `;

            headerRight.appendChild(controlsTop);

            let headerBottom = document.createElement('div');
            headerBottom.classList.add("header-bottom");

            let searchBar = document.createElement('input');
            searchBar.id = "zotero-roam-citations-autocomplete";
            searchBar.tabIndex = "1";
            searchBar.type = "text";
            searchBar.classList.add("bp3-input");
            // ARIA Labelling
            searchBar.setAttribute('aria-controls', 'zotero-roam-citations-pagination');

            headerBottom.appendChild(searchBar);

            // ---

            headerContent.appendChild(headerLeft);
            headerContent.appendChild(headerRight);
            headerContent.appendChild(headerBottom);
            
            // ---

            let pagination = document.createElement('div');
            pagination.id = "zotero-roam-citations-pagination";
            
            // ---

            dialogMainPanel.appendChild(headerContent);
            dialogMainPanel.appendChild(pagination);

            // ---

            let importHeader = document.createElement('div');
            importHeader.classList.add("import-header");
            importHeader.innerHTML = `
            ${zoteroRoam.utils.renderBP3Button_group("Cancel", {buttonClass: "bp3-minimal bp3-intent-warning", icon: "chevron-left", buttonAttribute: 'role="cancel"'})}
            ${zoteroRoam.utils.renderBP3Button_group("Add to Zotero", {buttonClass: "bp3-minimal bp3-intent-primary", icon: "inheritance", buttonAttribute: 'disabled role="add" style="font-weight:600;"'})}
            `;

            let importOptions = document.createElement('div');
            importOptions.classList.add("import-options");

            let optionsLib = document.createElement('div');
            optionsLib.classList.add("options-library-list");

            let optionsColl = document.createElement('div');
            optionsColl.classList.add("options-collections-list");

            let optionsTags = document.createElement('div');
            optionsTags.classList.add("options-tags");

            let tagsSelect = document.createElement('div');
            tagsSelect.classList.add("options-tags-select");
            tagsSelect.classList.add("bp3-input-group");
            tagsSelect.classList.add("bp3-small");

            let tagsIcon = document.createElement('span');
            tagsIcon.classList.add("bp3-icon");
            tagsIcon.classList.add("bp3-icon-tag");
            tagsIcon.classList.add("bp3-intent-primary");

            let tagsSearchBar = document.createElement('input');
            tagsSearchBar.id = "zotero-roam-tagselector_citations";
            tagsSearchBar.tabIndex = "1";
            tagsSearchBar.type = "text";
            tagsSearchBar.classList.add("zotero-roam-tags-autocomplete");
            tagsSearchBar.classList.add("bp3-input");
            tagsSearchBar.classList.add("bp3-fill");
            tagsSearchBar.setAttribute("autocomplete", "off");

            let tagsSelection = document.createElement('div');
            tagsSelection.classList.add("options-tags_selection");
            tagsSelection.setAttribute("data-tags", "[]");

            tagsSelect.appendChild(tagsIcon);
            tagsSelect.appendChild(tagsSearchBar);

            optionsTags.appendChild(tagsSelect);
            optionsTags.appendChild(tagsSelection);

            importOptions.appendChild(optionsLib);
            importOptions.appendChild(optionsColl);
            importOptions.appendChild(optionsTags);

            let itemsHeader = document.createElement('h5');
            itemsHeader.innerText = "Selected Items";
            itemsHeader.classList.add("import-selection-header");

            let importItems = document.createElement('div');
            importItems.classList.add("import-items");
            importItems.classList.add("bp3-list-unstyled");

            // Attribute a role to the side panel
            dialogSidePanel.setAttribute('zr-import', 'citations');

            dialogSidePanel.appendChild(importHeader);
            dialogSidePanel.appendChild(importOptions);
            dialogSidePanel.appendChild(itemsHeader);
            dialogSidePanel.appendChild(importItems);

            // ---

            let footerActions = document.createElement('div');
            footerActions.classList.add("bp3-dialog-footer-actions");
            footerActions.innerHTML = `
            <div class="bp3-button-group bp3-minimal">
                ${zoteroRoam.utils.renderBP3Button_group(string = "", {icon: "chevron-left", buttonClass: "zotero-roam-page-control", buttonAttribute: 'goto="previous" aria-controls="zotero-roam-citations-pagination"'})}
                ${zoteroRoam.utils.renderBP3Button_group(string = "", {icon: "chevron-right", buttonClass: "zotero-roam-page-control", buttonAttribute: 'goto="next" aria-controls="zotero-roam-citations-pagination"'})}
                <span class="zotero-roam-citations-results-count zr-auxiliary"></span>
            </div>
            <input class="bp3-input clipboard-copy-utility" type="text" readonly style="opacity:0;">
            `;
            dialogMainPanel.appendChild(footerActions);

            
            // Storing info in variables
            zoteroRoam.interface.citations.overlay = document.querySelector(`.${divClass}-overlay`);
            zoteroRoam.interface.citations.input = document.querySelector("#zotero-roam-citations-autocomplete");
            zoteroRoam.interface.citations.closeButton = document.querySelector(`.${divClass}-overlay button.zotero-roam-overlay-close`);

            // Rigging page controls
            Array.from(zoteroRoam.interface.citations.overlay.querySelectorAll(".zotero-roam-page-control")).forEach(control => {
                control.addEventListener("click", (e) => { zoteroRoam.interface.changePage(goto = control.getAttribute("goto")) });
            });

            // Rigging pagination div
            pagination.addEventListener("click", function(e){
                let btn = e.target.closest('button');
                if(btn){
                    if(btn.classList.contains('zotero-roam-citation-copy-doi')){
                        // Copy-to-clipboard buttons for DOIs
                        zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').value = btn.dataset.doi;
                        zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').select();
                        document.execCommand("copy");
                    } else if(btn.classList.contains('zotero-roam-citation-toggle-abstract')){
                        // Toggles for abstracts
                        let toggleText = btn.querySelector('.bp3-button-text');
                        let abstractSpan = btn.closest('.zotero-roam-citations-search_result').querySelector('.zotero-roam-citation-abstract');
                        if(abstractSpan.style.display == "none"){
                            abstractSpan.style.display = "block";
                            toggleText.innerHTML = `Hide Abstract`;
                        } else {
                            abstractSpan.style.display = "none";
                            toggleText.innerHTML = `Show Abstract`;
                        }
                    } else if(btn.classList.contains('zotero-roam-citation-add-import')){
                         // Add to Import buttons
                        zoteroRoam.interface.triggerImport(type = "citations", element = btn.closest('.bp3-menu-item'));
                    }
                }

            });

        },

        fillDashboardOverlay(){
            let dialogMainPanel = document.querySelector('.zotero-roam-dashboard-overlay .main-panel');
            let tabs = [
                {name: 'tag-manager', icon: 'tag', title: 'Tag Manager', description: 'Rename, merge, and delete tags - harmonize tags between <span data-tag-source="roam">Roam</span> and <span data-tag-source="zotero">Zotero</span>'}
            ];
            
            // Side Section
            let sideSection = document.createElement('div');
            sideSection.classList.add('side-section');

            let bp3TabsList = document.createElement('div');
            bp3TabsList.classList.add('bp3-tabs');
            bp3TabsList.classList.add('bp3-vertical');

            let tabList = document.createElement('ul');
            tabList.classList.add('bp3-tab-list');
            tabList.setAttribute('role', 'tablist');

            tabs.forEach((tab, i) => {
                tabList.innerHTML += `
                <li class="bp3-tab" role="tab" name="${tab.name}" ${i == 0 ? 'aria-selected="true"' : ''}>
                    <span class="bp3-icon bp3-icon-${tab.icon}"></span>
                    ${tab.title}
                </li>`
            });

            bp3TabsList.appendChild(tabList);
            sideSection.appendChild(bp3TabsList);

            // Main Section
            let mainSection = document.createElement('div');
            mainSection.classList.add('main-section');

            tabs.forEach((tab, i) => {
                mainSection.innerHTML += `
                <div class="bp3-tab-panel" role="tabpanel" name="${tab.name}" ${i == 0 ? '' : 'aria-hidden="true"'}>
                    <div class="zr-tab-panel-header">
                        <span class="zr-auxiliary">${tab.description}</span>
                        <div class="controls-top zr-auxiliary">
                            <button type="button" aria-label="Close" class="zotero-roam-overlay-close bp3-button bp3-minimal bp3-dialog-close-button bp3-large">
                            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>
                        </div>
                    </div>
                </div>
                `;
            });


            dialogMainPanel.appendChild(sideSection);
            dialogMainPanel.appendChild(mainSection);

            let tagManager = document.querySelector('.zotero-roam-dashboard-overlay .bp3-tab-panel[name="tag-manager"]');
            tagManager.innerHTML += `
            <div class="zr-tab-panel-toolbar">
                <div class="bp3-button-group bp3-minimal">
                    <a class="bp3-button bp3-icon-sort-alphabetical bp3-active" tabindex="0" role="button">Name</a>
                    <a class="bp3-button bp3-icon-sort-desc" tabindex="0" role="button">Most Used</a>
                </div>
                <div class="bp3-control-group">
                    <div class="bp3-html-select bp3-minimal">
                        <select>
                            <option selected value="contains">Contains...</option>
                            <option value="starts">Starts with...</option>
                        </select>
                        <span class="bp3-icon bp3-icon-caret-down"></span>
                    </div>
                    <input type="text" class="bp3-input" spellcheck='false' autocomplete='off' />
                </div>
            </div>
            <div class="bp3-overlay zr-tab-panel-popover" zr-panel="tag-manager" overlay-visible="hidden" style="flex: 0 1 100%;position: relative;display:none;">
                <div class="bp3-dialog-container bp3-overlay-content">
                    <div class="bp3-dialog" role="dialog">
                        <div class="bp3-dialog-body"></div>
                        <div class="bp3-dialog-footer"></div>
                    </div>
                </div>
            </div>
            <ul class="zr-tab-panel-datalist bp3-menu" role="listbox" zr-panel="tag-manager">
            </ul>
            <div class="zr-tag-stats">
                <span class="zr-stats-zotero"></span>
                <span class="zr-stats-roam"></span>
            </div>
            `;

        },

        async handleImportPanelClicks(e){
            let importDiv = e.target.closest('[zr-import]');
            let type = importDiv.getAttribute('zr-import');

            // Rigging header buttons
            let btn = e.target.closest('button[role]');
            if(btn !== null){
                switch(btn.getAttribute("role")){
                    case "cancel":
                        zoteroRoam.interface.clearImportPanel(action = "close", type = type);
                        break;
                    case "add":
                        btn.setAttribute("disabled", "");
                        let importOutcome = await zoteroRoam.handlers.importSelectedItems(importDiv);
                        // Citations panel
                        if(type == "citations"){
                            zoteroRoam.citations.activeImport.outcome = importOutcome;
                            zoteroRoam.interface.renderImportResults(importOutcome);
                        } else if(type == "weblinks"){
                            zoteroRoam.webImport.activeImport.outcome = importOutcome;
                        }
                        // Update the "Add ..." button
                        btn.classList.remove("bp3-intent-primary");
                        let icn = btn.querySelector(".bp3-icon");
                        icn.classList.remove("bp3-icon-inheritance");
                        icn.classList.add("bp3-icon-tick");
                        icn.setAttribute("icon", "tick");
                        btn.querySelector(".bp3-button-text").innerText = "Done";
                        btn.classList.add("bp3-intent-success");
                        btn.removeAttribute("disabled");
                        btn.setAttribute("role", "done");
                        break;
                    case "done":
                        zoteroRoam.interface.clearImportPanel(action = "reset", type = type);
                }
            }

            // Rigging library selection section
            let libOption = e.target.closest('input[name="library"]');
            if(libOption !== null){
                zoteroRoam.interface.selectImportLibrary(type = type);
            }

            // Rigging tags selection section
            let tagsSelection = e.target.closest('.options-tags_selection');
            if(tagsSelection !== null){
                let removeBtn = e.target.closest('.bp3-tag-remove');
                if(removeBtn !== null){
                    let tag = removeBtn.closest('.bp3-tag');
                    try{
                        let tagsSelection = importDiv.querySelector(".options-tags_selection");
                        tagsSelection.dataset.tags = JSON.stringify(JSON.parse(tagsSelection.dataset.tags).filter(t => t!= tag.dataset.tag));
                        tag.remove();
                    } catch(e){
                        console.error(e);
                    }
                }
            }

            // Rigging import items section
            let importItems = e.target.closest('.import-items');
            if(importItems !== null){
                let removeBtn = e.target.closest('button.selected_remove-button');
                if(removeBtn !== null){
                    let item = removeBtn.closest(".import-items_selected");
                    try{
                        // Citations panel
                        if(type == "citations"){
                            zoteroRoam.citations.activeImport.items = zoteroRoam.citations.activeImport.items.filter(i => i!= item.dataset.identifier);
                            item.remove();
                            zoteroRoam.interface.citations.overlay.querySelector(".import-selection-header").innerText = `Selected Items (${zoteroRoam.citations.activeImport.items.length})`;
                            if(zoteroRoam.citations.activeImport.items.length == 0){
                                zoteroRoam.interface.citations.overlay.querySelector(`button[role="add"]`).setAttribute("disabled", "");
                                zoteroRoam.interface.citations.overlay.querySelector(".import-selection-header").innerText = `Selected Items`;
                            }
                        }
                    } catch(e){
                        console.error(e);
                    }
                }
            }
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
            paginationDiv.closest('.main-panel').querySelector(".zotero-roam-citations-results-count").innerHTML = `
            <strong>${zoteroRoam.citations.pagination.startIndex}-${zoteroRoam.citations.pagination.startIndex + page.length - 1}</strong> / ${zoteroRoam.citations.pagination.data.length} ${zoteroRoam.citations.currentType}
            `;
            // Grab current page data, generate corresponding HTML, then inject as contents of paginatedList
            paginatedList.innerHTML = page.map(cit => {
                let titleEl = `<span class="zotero-roam-search-item-title" style="display:block;">${cit.title}</span>`;
                // let keywordsEl = cit.keywords.length > 0 ? `<span class="zotero-roam-search-item-tags">${cit.keywords.map(w => "#" + w).join(", ")}</span>` : "";
                let origin = cit.authors + (cit.year ? " (" + cit.year + ")" : "");
                let metaEl = `<span class="zotero-roam-citation-origin zr-highlight-2">${origin}</span><span class="zr-secondary">${cit.meta}</span>`;
                let linksEl = "";
                for(var service of Object.keys(cit.links)){
                    let linksArray = [];
                    switch(service){
                        case "scite":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="scite"><a href="${cit.links[service]}" target="_blank" class="zr-text-small">Scite</a></span>`);
                            break;
                        case "connectedPapers":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="connected-papers"><a href="${cit.links[service]}" target="_blank" class="zr-text-small">Connected Papers</a></span>`);
                            break;
                        case "semanticScholar":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="semantic-scholar"><a href="${cit.links[service]}" target="_blank" class="zr-text-small">Semantic Scholar</a></span>`);
                            break;
                        case "googleScholar":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="google-scholar"><a href="${cit.links[service]}" target="_blank" class="zr-text-small">Google Scholar</a></span>`);
                            break;
                    }
                    linksEl += linksArray.join(" - ");
                }

                let keyEl = `
                <span class="bp3-menu-item-label zotero-roam-search-item-key">
                `;

                if(cit.inLibrary){
                    keyEl += cit.citekey;
                    // TODO: Add buttons to view item + go to Roam page (if exists)
                } else {
                    keyEl += `
                    <a href="${cit.doi ? "https://doi.org/" + cit.doi : cit.url}" target="_blank" class="bp3-text-muted zr-text-small zotero-roam-citation-identifier-link">${cit.doi ? cit.doi : "Semantic Scholar"}</a>
                    ${cit.abstract ? zoteroRoam.utils.renderBP3Button_group("Show Abstract", {buttonClass: "zotero-roam-citation-toggle-abstract zr-text-small bp3-minimal"}) : ""}
                    ${!cit.doi ? "" : zoteroRoam.utils.renderBP3Button_group("Copy DOI", {buttonClass: "zotero-roam-citation-copy-doi zr-text-small bp3-small bp3-minimal", buttonAttribute: 'data-doi="' + cit.doi + '"'})}
                    ${zoteroRoam.utils.renderBP3Button_group("Add to Zotero", {buttonClass: "zotero-roam-citation-add-import zr-text-small bp3-small bp3-minimal bp3-intent-primary", icon: "inheritance"})}
                    `;
                }

                keyEl += `
                </span>
                `;

                return `
                <li class="zotero-roam-citations-search_result" ${cit.inLibrary ? 'in-library="true"' : ""} data-intent=${cit.intent ? JSON.stringify(cit.intent) : ""} ${cit.isInfluential ? 'is-influential' : ""}>
                <div class="bp3-menu-item">
                <div class="bp3-text-overflow-ellipsis zotero-roam-citation-metadata">
                ${titleEl}
                ${metaEl}
                <span class="zotero-roam-citation-links-list">
                ${linksEl}
                </span>
                </div>
                ${keyEl}
                <span class="zotero-roam-citation-abstract" style="display:none;">${cit.abstract || ""}</span>
                </div></li>
                `
            }).join("");

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
                zoteroRoam.interface[`${key}`].div.addEventListener("click", (e) => {
                    let target = zoteroRoam.interface.contextTarget;
                    let op = e.target.closest('li.zotero-roam-cm-option');
                    if(op){
                        let action = op.innerText;
                        switch(action){
                            case "Add metadata":
                                // The DOM element with class "rm-page-ref" is the target of mouse events -- but it's its parent that has the information about the citekey + the page UID
                                let citekey = target.parentElement.dataset.linkTitle;
                                let pageUID = target.parentElement.dataset.linkUid;
                                zoteroRoam.handlers.importItemMetadata(title = citekey, uid = pageUID);
                                break;
                            case "Convert to citation":
                                zoteroRoam.inPage.convertToCitekey(target);
                                break;
                            case "Check for citing papers":
                                zoteroRoam.handlers.checkForSemantic_citations(target);
                                break;
                            case "View item information":
                                zoteroRoam.interface.popItemInformation(target);
                                break;
                            case "Update Zotero data":
                                zoteroRoam.extension.update();
                                break;
                            case "Search in library":
                                zoteroRoam.interface.toggleSearchOverlay("show");
                                break;
                        }
                    }
                });
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
                zoteroRoam.data.roamPages = new Map(zoteroRoam.utils.getRoamPages());
                if(focus == true){
                    await zoteroRoam.utils.sleep(75);
                    zoteroRoam.interface.search.input.focus();
                }
                document.querySelector(".zotero-roam-library-results-count").innerHTML = ``;
                zoteroRoam.interface.search.input.value = "";
                document.getElementById('zotero-roam-library-rendered').removeAttribute('has-results');
                zoteroRoam.interface.search.overlay.setAttribute("overlay-visible", "true");
            } else {
                zoteroRoam.interface.clearSelectedItem();
                try{zoteroRoam.librarySearch.autocomplete.close()}catch(e){};
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

        popCitationsOverlay(doi, citekey, type = "citations"){
            zoteroRoam.citations.currentDOI = doi;
            zoteroRoam.citations.currentCitekey = citekey;
            zoteroRoam.citations.currentType = type;
            // All citations -- paginated
            let fullData = zoteroRoam.data.semantic.get(doi)[`${type}`];
            let doisInLib = new Map(zoteroRoam.data.items.filter(i => i.data.DOI).map(i => [zoteroRoam.utils.parseDOI(i.data.DOI), i.key]));
            fullData.forEach((paper, i) => {
                if(paper.doi && doisInLib.has(zoteroRoam.utils.parseDOI(paper.doi))){ 
                    fullData[i].inLibrary = true;
                    fullData[i].citekey = doisInLib.get(paper.doi)
                }
            });
            
            zoteroRoam.citations.pagination = new zoteroRoam.Pagination({data: fullData, render: 'zoteroRoam.interface.renderCitationsPagination'});
            // Render HTML for pagination
            zoteroRoam.interface.renderCitationsPagination();
            // Setup autocomplete
            if(zoteroRoam.citations.autocomplete == null){
                // zoteroRoam.config.citationsSearch.resultsList.maxResults = zoteroRoam.data.items.length;
                zoteroRoam.citations.autocomplete = new autoComplete(zoteroRoam.config.citationsSearch);
            } else {
                zoteroRoam.citations.autocomplete.init();
            }
            // Rendering panel title
            let relation = type == "citations" ? "Citing" : "Referenced by"
            let panelTitle = zoteroRoam.interface.citations.overlay.querySelector("h5.panel-tt");
            panelTitle.innerText = `${relation} @${citekey}`;
            panelTitle.setAttribute("list-type", type);
            // Make overlay visible
            zoteroRoam.interface.citations.overlay.style.display = "block";
            zoteroRoam.interface.citations.input.value = "";
            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').value = "";
            zoteroRoam.interface.citations.overlay.setAttribute("overlay-visible", "true");
            zoteroRoam.interface.citations.input.focus();
        },

        popRelatedDialog(title, keys, type){
            let overlay = document.querySelector('.zotero-roam-auxiliary-overlay');
            let suffix = keys.length > 1 ? "s" : "";
            let relation = (type == "added-on") ? `item${suffix} added on` : (type == "tagged-with" ? `item${suffix} tagged with` : `abstract${suffix} mentioning`);
            // Fill the dialog
            overlay.querySelector('.main-panel .header-left').innerHTML = `
            <h5 id="zr-related-dialogtitle" class="panel-tt" list-type="${type}">${keys.length} ${relation} ${title}</h5>
            `;
            let papersInGraph = new Map(zoteroRoam.utils.getAllRefPages());
            let defaultSort = type == "added-on" ? "timestamp" : "meta";
            let items = keys.map(k => {
                let libItem = zoteroRoam.data.items.find(i => i.key == k);
                let year = libItem.meta.parsedDate ? `(${new Date(libItem.meta.parsedDate).getUTCFullYear()})` : "";
                let creator = libItem.meta.creatorSummary + " " || "";
                let inGraph = papersInGraph.get('@' + k) || false;
                return {
                    abstract: libItem.data.abstractNote || "",
                    key: k,
                    meta: `${creator}${year}`,
                    title: libItem.data.title || "",
                    inGraph: inGraph,
                    added: libItem.data.dateAdded,
                    itemType: libItem.data.itemType,
                    timestamp: zoteroRoam.utils.makeTimestamp(libItem.data.dateAdded)
                }
            }).sort((a,b) => (a[`${defaultSort}`].toLowerCase() < b[`${defaultSort}`].toLowerCase() ? -1 : 1));
            let itemsList = items.map(item => {
                let actionsDiv = "";
                if(!item.inGraph){
                    actionsDiv = zoteroRoam.utils.renderBP3Button_group("Add to Roam", {icon: "minus", buttonClass: "bp3-minimal bp3-intent-warning zr-text-small bp3-small zotero-roam-add-to-graph"});
                } else {
                    let itemKey = '@' + item.key;
                    actionsDiv = zoteroRoam.utils.renderBP3ButtonGroup("Go to page", {buttonClass: "zotero-roam-list-item-go-to-page", divClass: "bp3-minimal zr-text-small bp3-small", icon: "symbol-circle", modifier: "bp3-intent-success", buttonModifier: `data-uid="${item.inGraph}" data-citekey="${itemKey.slice(1)}"`});
                }
                return `
                <li class="zotero-roam-list-item" in-graph="${item.inGraph ? true : false}" data-item-type="${item.itemType}">
                <div class="bp3-menu-item" label="${item.key}">
                    ${type == "added-on" ? `<span class="bp3-menu-item-label zotero-roam-item-timestamp zr-text-small">${item.timestamp}</span>` : ""}
                    <div class="bp3-text-overflow-ellipsis bp3-fill zotero-roam-item-contents">
                        <span class="zotero-roam-search-item-title" style="white-space:normal;">${item.title}</span>
                        <span class="zr-highlight">${item.meta}</span>
                        <span class="zotero-roam-list-item-key zr-text-small zr-auxiliary">[${item.key}]</span>
                        ${item.abstract ? zoteroRoam.utils.renderBP3Button_group("Show Abstract", {buttonClass: "zotero-roam-citation-toggle-abstract bp3-intent-primary bp3-minimal bp3-small"}) : ""}
                        <span class="zotero-roam-citation-abstract zr-text-small zr-auxiliary" style="display:none;">${item.abstract}</span>
                    </div>
                    <span class="zotero-roam-list-item-actions">
                        ${actionsDiv}
                    </span>
                </div>
                </li>
                `;
            }).join("\n");

            overlay.querySelector('.main-panel .rendered-div').innerHTML = `
            <ul class="bp3-list-unstyled">
            ${itemsList}
            </ul>
            `
            // Make the dialog visible
            overlay.style.display = "block";
            overlay.setAttribute("overlay-visible", "true");

        },

        fillWebImportDialog(items){
            let overlay = document.querySelector('.zotero-roam-auxiliary-overlay');

            let webItems = items.map((cit, j) => {
                return {
                    abstract: cit.data.abstractNote || "",
                    creators: cit.data.creators ? zoteroRoam.formatting.getCreators(cit, {creators_as: "string", brackets: false, use_type: false}) : "",
                    publication: cit.data.publicationTitle || cit.data.bookTitle || cit.data.websiteTitle || "",
                    title: cit.data.title || "",
                    itemType: cit.data.itemType,
                    clean_type: zoteroRoam.formatting.getItemType(cit),
                    url: cit.query,
                    item_index: j
                }
            });

            let suffix = webItems.length > 1 ? "s" : "";
            overlay.querySelector('.main-panel .header-left').innerHTML = `
            ${zoteroRoam.utils.renderBP3_option(string=`<h5 class="panel-tt" list-type="weblinks">${webItems.length} linked resource${suffix}</h5>`, type = "checkbox", depth = 0, {varName: "selectAll"})}
            `;

            let itemsList = webItems.map(item => {
                return `
                <li class="zotero-roam-list-item zr-explo-list-item" data-item-type="${item.itemType}">
                    <div class="bp3-menu-item" label="link-${item.item_index}">
                        <span class="zr-explo-title">${zoteroRoam.utils.renderBP3_option(string = `<a target="_blank" href="${item.url}">${item.title}</a>`, type = "checkbox", depth = 0, {varName: "explo-weblink", optValue: `${item.item_index}`})}</span>
                        <div class="bp3-text-overflow-ellipsis bp3-fill zotero-roam-item-contents">
                            <span class="zr-explo-metadata">${item.clean_type}${item.creators ? " | " + item.creators : ""}</span>
                            ${item.publication ? `<span class="zr-explo-publication zr-text-small bp3-text-disabled">${item.publication}</span>` : ""}
                            <span class="zr-explo-abstract zr-text-small bp3-text-muted">${item.abstract}</span>
                        </div>
                    </div>
                </li>
                `;
            }).join("\n");

            overlay.querySelector('.main-panel .rendered-div').innerHTML = `
            <ul class="bp3-list-unstyled">
            ${itemsList}
            </ul>
            `
            
        },

        closeAuxiliaryOverlay(){
            let overlay = document.querySelector('.zotero-roam-auxiliary-overlay');
            overlay.style.display = "none";
            overlay.setAttribute("overlay-visible", "false");
            zoteroRoam.interface.clearImportPanel(action = "close", type = "weblinks");
        },

        closeCitationsOverlay(){
            zoteroRoam.interface.citations.overlay.style.display = "none";
            zoteroRoam.interface.citations.input.value = "";
            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').value = "";
            zoteroRoam.interface.clearImportPanel(action = "close", type = "citations");
            zoteroRoam.interface.citations.overlay.setAttribute("overlay-visible", "false");
        },

        popContextOverlay(e, elementKey){
            e.preventDefault();
            const origin = {
                left: e.pageX,
                top: e.pageY
            };
            zoteroRoam.interface[`${elementKey}`].position(origin);
            zoteroRoam.interface.contextTarget = e.target;
            return false;
        },

        async popContextMenu(e){
            zoteroRoam.interface.popContextOverlay(e, "contextMenu");
            await zoteroRoam.utils.sleep(120);
            try{
                // Hide default Roam context menu
                document.querySelector('body > .bp3-context-menu+.bp3-portal').style.display = "none";
            } catch(e){};
        },

        popIconContextMenu(e){
            zoteroRoam.interface.popContextOverlay(e, "iconContextMenu");
        },

        popItemInformation(refSpan){
            let citekey = refSpan.parentElement.dataset.linkTitle.replace("@", "");
            zoteroRoam.interface.renderItemInPanel(citekey);
        },

        renderItemInPanel(citekey){
            let itemKey = citekey.startsWith('@') ? citekey : '@' + citekey;
            let selectedItem = zoteroRoam.data.items.find(it => it.key == itemKey.slice(1));

            let itemYear = (selectedItem.meta.parsedDate) ? ` (${(new Date(selectedItem.meta.parsedDate)).getUTCFullYear().toString()})` : "";
            let itemAuthors = selectedItem.data.creators.length > 0 ? `<span class="zotero-roam-search-item-authors zr-highlight">${selectedItem.meta.creatorSummary || ""}${itemYear}</span>` : ``;
            let itemMeta = selectedItem.data.publicationTitle || selectedItem.data.bookTitle || selectedItem.data.university || "";
            if(itemMeta.length > 2){
                itemMeta = `<span class="zr-secondary">${itemMeta}</span>`;
            } else {
                itemMeta = ``;
            }
            let itemWeb = ``;
            if(selectedItem.data.DOI){
                let clean_doi = zoteroRoam.utils.parseDOI(selectedItem.data.DOI);
                if(clean_doi){
                    itemWeb = `
                    <span class="item-weblink zr-secondary" style="display:block;">
                        <a href="https://doi.org/${clean_doi}" target="_blank">${clean_doi}</a>
                    </span>`;
                }
            } else if(selectedItem.data.url){
                itemWeb = `
                <span class="item-weblink zr-secondary" style="display:block;">
                    <a href="${selectedItem.data.url}" target="_blank">${selectedItem.data.url}</a>
                </span>`;
            }

            // Generate list of authors as bp3 tags or Roam page references
            let infoAuthors = selectedItem.data.creators.map(c => {return (c.name) ? c.name : [c.firstName, c.lastName].filter(Boolean).join(" ")});
            let infoRolesAuthors = selectedItem.data.creators.map(c => c.creatorType);
            let divAuthors = "";
            if(infoAuthors.length > 0){
                divAuthors = `<strong>Contributors : </strong>`;
                for(i=0; i < infoAuthors.length; i++){
                    let authorInGraph = zoteroRoam.utils.lookForPage(title = infoAuthors[i]);
                    let authorElem = (authorInGraph.present == true) ? zoteroRoam.utils.renderPageReference(title = infoAuthors[i], uid = authorInGraph.uid) : zoteroRoam.utils.renderBP3Tag(string = infoAuthors[i], {modifier: "bp3-intent-primary item-creator-tag"});
                    let authorRole = (infoRolesAuthors[i] && infoRolesAuthors[i] != "author") ? (` (${infoRolesAuthors[i]}) `) : " ";
                    divAuthors = divAuthors + authorElem + authorRole;
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
            let iconEl = (pageInGraph.present == true) ? `<span class="bp3-icon bp3-icon-symbol-circle"></span>` : `<span class="bp3-icon bp3-icon-minus"></span>`;
            
            // Render the header section
            let headerDiv = document.querySelector(".selected-item-header");
            headerDiv.innerHTML = `
            <div class="item-basic-metadata">
                <h4 class="item-title" tabindex="0">${selectedItem.data.title || ""}</h4>
                ${itemAuthors}${itemMeta}${itemWeb}
                </div>
            <div class="item-citekey-section" in-graph="${pageInGraph.present || false}">
                <div class="bp3-fill citekey-element">${iconEl}${itemKey}</div>
                <div class="bp3-button-group bp3-fill bp3-minimal copy-buttons">
                    <a class="bp3-button bp3-small bp3-intent-primary" format="citekey">Copy @citekey ${(zoteroRoam.shortcuts.sequences["copyCitekey"]) ? zoteroRoam.shortcuts.makeSequenceText("copyCitekey") : ""}</a>
                    <a class="bp3-button bp3-small bp3-intent-primary" format="citation">[Citation]([[@]]) ${(zoteroRoam.shortcuts.sequences["copyCitation"]) ? zoteroRoam.shortcuts.makeSequenceText("copyCitation") : ""}</a>
                    <a class="bp3-button bp3-small bp3-intent-primary" format="tag">#@ ${(zoteroRoam.shortcuts.sequences["copyTag"]) ? zoteroRoam.shortcuts.makeSequenceText("copyTag") : ""}</a>
                    <a class="bp3-button bp3-small bp3-intent-primary" format="page-reference">[[@]] ${(zoteroRoam.shortcuts.sequences["copyPageRef"]) ? zoteroRoam.shortcuts.makeSequenceText("copyPageRef") : ""}</a>
                </div>
            </div>
            `;

            // Render the graph info section
            let bodyDiv = document.querySelector(".selected-item-body");

            let openWebElement = ``;
            if(selectedItem.data.DOI && selectedItem.data.DOI.startsWith("10.")){
                let target = `https://doi.org/${selectedItem.data.DOI}`;
                openWebElement = zoteroRoam.utils.renderBP3Button_link(string = "Open in browser", {linkClass: "bp3-minimal bp3-fill bp3-align-left item-open-in-browser", icon: "share", iconModifier: "bp3-intent-primary", target: target, linkAttribute: `target="_blank"`});
            } else if(selectedItem.data.url){
                openWebElement = zoteroRoam.utils.renderBP3Button_link(string = "Open in browser", {linkClass: "bp3-minimal bp3-fill bp3-align-left item-open-in-browser", icon: "share", iconModifier: "bp3-intent-primary", target: selectedItem.data.url, linkAttribute: `target="_blank"`});
            }
            

            let goToModifier = (pageInGraph.present == true) ? `data-uid="${pageInGraph.uid}"` : "disabled";
            let goToSeq = (zoteroRoam.shortcuts.sequences["goToItemPage"]) ? zoteroRoam.shortcuts.makeSequenceText("goToItemPage", pre = " ") : "";
            let goToText = `Go to Roam page  ${goToSeq}`;
            let goToButtonGroup = zoteroRoam.utils.renderBP3ButtonGroup(string = goToText, {buttonClass: "item-go-to-page", divClass: "bp3-minimal bp3-fill bp3-align-left", icon: "arrow-right", modifier: "bp3-intent-primary", buttonModifier: `${goToModifier} data-citekey="${itemKey.slice(1)}"`});

            let importModifier = (pageInGraph.present == true) ? `data-uid="${pageInGraph.uid}"` : `data-uid=""`;
            let importSeq = (zoteroRoam.shortcuts.sequences["importMetadata"]) ? zoteroRoam.shortcuts.makeSequenceText("importMetadata", pre = " ") : "";
            let importText = `Import metadata  ${importSeq}`;
            let importButtonGroup = zoteroRoam.utils.renderBP3ButtonGroup(string = importText, { buttonClass: "item-add-metadata", divClass: "bp3-minimal bp3-fill bp3-align-left", icon: "add", modifier: "bp3-intent-primary", buttonModifier: `${importModifier} data-citekey="${itemKey.slice(1)}"` });

            // Check for children items
            let infoChildren = zoteroRoam.formatting.getItemChildren(selectedItem, { pdf_as: "raw", notes_as: "raw" });
            let childrenDiv = "";
            if(infoChildren.remoteChildren){
                childrenDiv += `<p>This item has children, but they were not returned by the API data request. This might be due to a request for 'items/top' rather than 'items'.</p>`;
            } else {
                try {
                    let pdfDiv = (!infoChildren.pdfItems) ? `No PDF attachments` : infoChildren.pdfItems.map(item => {
                        let libLoc = item.library.type == "group" ? `groups/${item.library.id}` : `library`;
                        let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(item.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${item.data.key}` : item.data.url;
                        let pdfTitle = item.data.filename || item.data.title;
                        return zoteroRoam.utils.renderBP3Button_link(string = pdfTitle, {linkClass: "bp3-minimal item-pdf-link", icon: "paperclip", target: pdfHref, linkAttribute: `target="_blank"` });
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
                <p class="item-abstract zr-text-small bp3-running-text">${selectedItem.data.abstractNote}</p>
                <p class="item-creators">${divAuthors}</p>
                <p class="item-tags">${divTags}</p>
                <p class="item-collections">${divCollections}</p>
            </div>
            <div class="item-actions">
                <div class="bp3-card">
                    ${openWebElement}
                    ${goToButtonGroup}
                    ${importButtonGroup}
                </div>
                <div class="item-pdf-notes">
                    ${childrenDiv}
                </div>
            </div>
            `;

            Array.from(document.querySelectorAll('.item-citekey-section .copy-buttons a.bp3-button[format]')).forEach(btn => {
                btn.addEventListener("click", (e) => {
                    let copyUtil = zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility');
                    switch(btn.getAttribute('format')){
                        case 'citekey':
                            copyUtil.value = `${itemKey}`;
                            break;
                        case 'citation':
                            let citationText = `${selectedItem.meta.creatorSummary || ""}${itemYear || ""}`;
                            copyUtil.value = `[${citationText}]([[${itemKey}]])`;
                            break;
                        case 'tag':
                            copyUtil.value = `#[[${itemKey}]]`;
                            break;
                        case 'page-reference':
                            copyUtil.value = `[[${itemKey}]]`;
                    };
                    copyUtil.select();
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
                let item = e.detail.item;
                if(item.original.source == "zotero"){
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
                }
            });

        },

        // Add to import list to Zotero
        triggerImport(type = "citations", element = null){
            let importDiv = document.querySelector(`[zr-import="${type}"]`);
            let currentImport = type == "citations" ? zoteroRoam.citations.activeImport : zoteroRoam.webImport.activeImport;

            if(currentImport == null){
                zoteroRoam.data.roamPages = new Map(zoteroRoam.utils.getRoamPages());
                zoteroRoam.tagSelection[type == "citations" ? "cit_panel" : "aux_panel"].init();
                zoteroRoam.activeImport.libraries = zoteroRoam.utils.getLibraries();
                zoteroRoam.interface.renderImportOptions(type = type);
            } else if(type == "citations" && importDiv.querySelector(`button[role="done"]`)){
                zoteroRoam.interface.clearImportPanel(action = "reset", type = type);
            }

            if(type == "citations"){
                zoteroRoam.interface.renderImportCitations(element);
            } else if(type == "weblinks"){
                zoteroRoam.interface.renderImportWeblinks();
            }

            let any_select = currentImport ? currentImport.items.length > 0 : false;
            if(any_select && zoteroRoam.activeImport.currentLib){
                // Only enable the "Add" button if there is a library selected, & at least one item is selected
                importDiv.querySelector(`button[role="add"]`).removeAttribute("disabled");
            } else {
                importDiv.querySelector(`button[role="add"]`).setAttribute("disabled", "");
            }

        },

        renderImportCitations(element){
            let importDiv = document.querySelector(`[zr-import="citations"]`);
            let identifier = element.querySelector(".zotero-roam-citation-identifier-link").innerText;
            let title = element.querySelector(".zotero-roam-search-item-title").innerText;
            let origin = element.querySelector(".zotero-roam-citation-origin").innerText;
            if(zoteroRoam.citations.activeImport == null){
                zoteroRoam.citations.activeImport = {
                    items: [],
                    outcome: null
                }
                zoteroRoam.interface.triggerImport(type = "citations", element);
                importDiv.closest(".bp3-dialog").setAttribute("side-panel", "visible");
            } else {
                if(!zoteroRoam.citations.activeImport.items.includes(identifier)){
                    zoteroRoam.citations.activeImport.items.push(identifier);
                    importDiv.querySelector(".import-items").innerHTML += `
                    <li class="import-items_selected" data-identifier="${identifier}">
                    <div class="selected_info">
                    <span class="selected_title bp3-text-muted">${title}</span>
                    <span class="selected_origin">${origin}</span>
                    </div>
                    <div class="selected_state">
                    ${zoteroRoam.utils.renderBP3Button_group(string = "", {buttonClass: "bp3-small bp3-minimal bp3-intent-danger selected_remove-button", icon: "cross"})}
                    </div>
                    </li>
                    `;
                    importDiv.querySelector(".import-selection-header").innerText = `Selected Items (${zoteroRoam.citations.activeImport.items.length})`;
                }
            }
        },

        renderImportWeblinks(){
            if(zoteroRoam.webImport.activeImport != null){
                let selectedItems = Array.from(document.querySelectorAll(`[name="explo-weblink"]`)).filter(op => op.checked);
                zoteroRoam.webImport.activeImport.items = selectedItems.map(i => zoteroRoam.webImport.activeImport.harvest[Number(i.getAttribute('value'))].data);
            }
        },

        renderImportOptions(type = "citations"){
            let importDiv = document.querySelector(`[zr-import="${type}"]`);
            let libs = zoteroRoam.activeImport.libraries;
            let optionsLib = zoteroRoam.utils.renderBP3_list(libs, "radio", {varName: "library", has_value: "path", has_string: "name", selectFirst: true, active_if: "writeable"});
            let optionsColl = "";
            let firstWriteableLib = libs.find(library => library.writeable == true);
            if(firstWriteableLib){
                zoteroRoam.activeImport.currentLib = firstWriteableLib;
                optionsColl = zoteroRoam.utils.renderBP3_list(firstWriteableLib.collections.map(cl => {return{name: cl.data.name, key: cl.key, depth: cl.depth}}), "checkbox", {varName: "collections", has_value: "key", has_string: "name"});
            } else {
                // If none of the libraries are writeable, the currentLib property will be empty which the triggerImport function will pick up on
            }
            importDiv.querySelector(".options-library-list").innerHTML = optionsLib;
            importDiv.querySelector(".options-collections-list").innerHTML = optionsColl;
            
        },

        renderImportResults(outcome){
            zoteroRoam.citations.activeImport.items.forEach(identifier => {
                let elem = zoteroRoam.interface.citations.overlay.querySelector(`.import-items_selected[data-identifier="${identifier}"]`);
                let harvest = outcome.harvest.find(res => res.query == identifier);
                switch(harvest.success){
                    case null:
                        elem.querySelector(".selected_state").innerHTML = `<span icon="ban-circle" class="bp3-icon bp3-icon-ban-circle bp3-intent-danger" title="${harvest.error.name} : ${harvest.error.message}"></span>`;
                        break;
                    case false:
                        elem.querySelector(".selected_state").innerHTML = `<span icon="error" class="bp3-icon bp3-icon-error bp3-intent-warning" title="${harvest.response.status}"></span>`;
                        break;
                    case true:
                        let citoid = harvest.data;
                        let write = outcome.write;
                        switch(write.success){
                            case null:
                                elem.querySelector(".selected_state").innerHTML = `<span icon="ban-circle" class="bp3-icon bp3-icon-ban-circle bp3-intent-danger" title="${write.error.name} : ${write.error.message}"></span>`;
                                break;
                            case false:
                                elem.querySelector(".selected_state").innerHTML = `<span icon="error" class="bp3-icon bp3-icon-error bp3-intent-warning" title="${write.response.status} : ${write.response.statusText}"></span>`;
                                break;
                            case true:
                                let libItem = Object.values(write.data.successful).find(item => item.data.title == citoid.title && item.data.url == citoid.url);
                                if(libItem){
                                    elem.querySelector(".selected_state").innerHTML = `<span icon="tick" class="bp3-icon bp3-icon-tick bp3-intent-success" title="${libItem.data.key}"></span>`;
                                }
                                // TODO: what if not successful ?
                                // If successful : Zotero key will be in libItem.key, or better yet libItem.data.key
                                // TODO: do I render with the Zotero key, then run updates until we get the citekey ?
                                // Or do I wait until we get the citekey to render ? (and have a loading thingy in the meantime? but then I'd have to wait?)
                        }
                }
            });
        },

        selectImportLibrary(type = "citations"){
            let importDiv = document.querySelector(`[zr-import="${type}"]`);
            let currentLoc = zoteroRoam.activeImport.currentLib.path;
            let newLoc = Array.from(importDiv.querySelectorAll(`.options-library-list [name="library"]`)).find(op => op.checked == true).value;
            if(newLoc != currentLoc){
                zoteroRoam.activeImport.currentLib = zoteroRoam.activeImport.libraries.find(lib => lib.path == newLoc);
                let optionsColl = zoteroRoam.utils.renderBP3_list(zoteroRoam.activeImport.currentLib.collections.map(cl => {return{name: cl.data.name, key: cl.key}}), "checkbox", {varName: "collections", has_value: "key", has_string: "name"});
                importDiv.querySelector(".options-collections-list").innerHTML = optionsColl;
            }
        },

        clearImportPanel(action = "close", type = "citations"){
            let importDiv = document.querySelector(`[zr-import="${type}"]`);
            switch(action){
                case "close":
                    importDiv.closest(".bp3-dialog").setAttribute("side-panel", "hidden");
                    if(type == "citations"){
                        zoteroRoam.citations.activeImport = null;
                    } else if(type == "weblinks"){
                        zoteroRoam.webImport.activeImport = null;
                    }
                    importDiv.querySelector(".options-library-list").innerHTML = ``;
                    importDiv.querySelector(".options-collections-list").innerHTML = ``;
                    break;
                case "reset":
                    if(type == "citations"){
                        zoteroRoam.citations.activeImport.items = [];
                        zoteroRoam.citations.activeImport.outcome = null;
                    } else if(type == "weblinks"){
                        // Reset all checkboxes
                        Array.from(importDiv.closest('.bp3-dialog').querySelectorAll(`[name="explo-weblink"]`)).forEach(lk => {lk.checked = false});
                        importDiv.closest('.bp3-dialog').querySelectorAll(`[name="selectAll"]`).checked = false;
                        zoteroRoam.webImport.activeImport.items = [];
                    }
            }
            
            let clearBtn = importDiv.querySelector(`button[role="done"]`);
            if(clearBtn){
                clearBtn.classList.remove("bp3-intent-success");
                clearBtn.querySelector(".bp3-icon").classList.remove("bp3-icon-tick");
                clearBtn.querySelector(".bp3-icon").classList.add("bp3-icon-inheritance");
                clearBtn.querySelector(".bp3-icon").setAttribute("icon", "inheritance");
                clearBtn.querySelector(".bp3-button-text").innerText = "Add to Zotero";
                clearBtn.classList.add("bp3-intent-primary");
                clearBtn.setAttribute("role", "add");
            }
            importDiv.querySelector(`button[role="add"]`).setAttribute("disabled", "");
            
            importDiv.querySelector(".zotero-roam-import-tags-list").value = ``;
            importDiv.querySelector(".options-tags_selection").innerHTML = ``;
            importDiv.querySelector(".options-tags_selection").dataset.tags = "[]";

            if(type == "citations"){
                // Unique to citations
                importDiv.querySelector(".import-selection-header").innerText = `Selected Items`;
                importDiv.querySelector(".import-items").innerHTML = ``;
            }

        }
    }
})();

;(()=>{
    zoteroRoam.extension = {

        /** Turns the extension 'on'
         * @fires zotero-roam:ready */
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
                zoteroRoam.utils.sleep(100);
                zoteroRoam.inPage.addPageMenus(wait = 0); // initial
                window.addEventListener('locationchange', zoteroRoam.inPage.addPageMenus, true); // URL change
                zoteroRoam.config.page_checking = setInterval(function(){zoteroRoam.inPage.addPageMenus(wait = 0)}, 1000); // continuous

                // Setup exploratory search buttons :
                if(zoteroRoam.config.userSettings.webimport){
                    zoteroRoam.config.tag_checking = setInterval(function(){zoteroRoam.inPage.addWebImport()}, 1000); // continuous
                }

                // Auto-update ?
                if(zoteroRoam.config.userSettings.autoupdate){
                    zoteroRoam.config.auto_update = setInterval(function(){zoteroRoam.extension.update(popup = false)}, 60000); // Update every 60s
                }

                // Render citekey refs as inline citations ?
                if(zoteroRoam.config.userSettings.render_inline){
                    zoteroRoam.config.render_inline = setInterval(function(){ zoteroRoam.inPage.renderCitekeyRefs()}, 1000); // continuous
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
                // Setup the tag selection autoComplete (citations panel)
                if(zoteroRoam.tagSelection.cit_panel == null){
                    zoteroRoam.tagSelection.cit_panel = zoteroRoam.config.tagSelection(selector = "#zotero-roam-tagselector_citations", index = "cit_panel");
                } else {
                    zoteroRoam.tagSelection.cit_panel.init();
                }
                // Setup the tag selection autoComplete (auxiliary panel)
                if(zoteroRoam.tagSelection.aux_panel == null){
                    zoteroRoam.tagSelection.aux_panel = zoteroRoam.config.tagSelection(selector = "#zotero-roam-tagselector_auxiliary", index = "aux_panel");
                } else {
                    zoteroRoam.tagSelection.aux_panel.init();
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

                // Adding SmartBlocks commands
                zoteroRoam.smartblocks.registerCommands();

                /**
                 * Ready event
                 * 
                 * @event zotero-roam:ready
                 * @type {object}
                 */
                zoteroRoam.events.emit('ready', detail = zoteroRoam.data);
                zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                zoteroRoam.interface.popToast(message = "Zotero data successfully loaded !", intent = "success");
                console.log('The results of the API request have been received ; you can check them by inspecting the value of the zoteroRoam.data object. Data import context menu should now be available.');

            }
        },

        /** Turns the extension 'off' */
        unload(){
            zoteroRoam.interface.icon.setAttribute("status", "off");
            zoteroRoam.data.items = [];
            zoteroRoam.data.collections = [];
            zoteroRoam.data.semantic.clear();
            zoteroRoam.data.keys = [];
            for(lib of zoteroRoam.data.libraries.keys()){
                zoteroRoam.data.libraries.get(lib).version = "0";
            }

            if(zoteroRoam.librarySearch.autocomplete !== null){
                zoteroRoam.librarySearch.autocomplete.unInit();
            }
            if(zoteroRoam.citations.autocomplete !== null){
                zoteroRoam.citations.autocomplete.unInit();
            }
            if(zoteroRoam.tagSelection.cit_panel !== null){
                zoteroRoam.tagSelection.cit_panel.unInit();
            }
            if(zoteroRoam.tagSelection.aux_panel !== null){
                zoteroRoam.tagSelection.aux_panel.unInit();
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
            try { clearInterval(zoteroRoam.config.tag_checking) } catch(e){};
            try { clearInterval(zoteroRoam.config.auto_update) } catch(e){};
            try { clearInterval(zoteroRoam.config.render_inline) } catch(e){};
            // Clean up ref citekeys rendering once more
            zoteroRoam.inPage.renderCitekeyRefs();
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
        
        /** Toggles the state of the extension (on/off) */
        toggle(){
            if(zoteroRoam.interface.icon.getAttribute('status') == "off"){
                zoteroRoam.extension.load();
            } else {
                zoteroRoam.extension.unload();
            }
        },

        /** Checks for data updates for an Array of requests
         * @fires zotero-roam:update
         * @param {string} popup - Specifies if a toast should display the update's outcome
         * @param {{apikey: string, dataURI: string, library: string, name: string, params: string}[]} reqs - The data requests to retrieve updates for
         */
        async update(popup = "true", reqs = zoteroRoam.config.requests){
            // Turn the icon background to orange while we're updating the data
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            // For each request, get the latest version of any item that belongs to it
            let updateRequests = reqs.map(rq => {
                let latest = zoteroRoam.data.libraries.get(rq.library).version;
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
            let updateResults = await zoteroRoam.handlers.requestData(updateRequests, update = true, collections = true);
            if(updateResults.success == true){
                updateResults.data.collections.forEach(collection => {
                    let inStore = zoteroRoam.data.collections.findIndex(cl => cl.key == collection.key);
                    if(inStore == -1){
                        zoteroRoam.data.collections.push(collection);
                    } else {
                        zoteroRoam.data.collections[inStore] = collection;
                    }
                })
                
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
                        let duplicateIndex = zoteroRoam.data.items.findIndex(libItem => libItem.data.key == item.data.key & libItem.requestLabel == item.requestLabel);
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
            /** Update event
             * @event zotero-roam:update
             * @type {object}
             * @property {?boolean} success - Indicates if the update was successful
             * @property {array} requests - The data requests that were part of the update
             * @property {object} data - The updated data, if any
             */
            zoteroRoam.events.emit('update', {
                success: updateResults.success,
                requests: updateRequests,
                data: updateResults.data
            })
        }
    };
})();

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
         * @param {string} settings.tooltip - Where should the tooltip be displayed ?
         * @returns {string} The HTML for the badge */
        makeSciteBadge(doi, {layout = "horizontal", showZero = "true", showLabels = "false", tooltip = "bottom"} = {}){
            let sciteBadge = document.createElement("div");
            sciteBadge.classList.add("scite-badge");
            sciteBadge.setAttribute("data-doi", doi);
            sciteBadge.setAttribute("data-layout", layout);
            sciteBadge.setAttribute("data-show-zero", showZero);
            sciteBadge.setAttribute("data-show-labels", showLabels);
            sciteBadge.setAttribute("data-tooltip-placement", tooltip);

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
            } else if(target.closest('.zotero-roam-explo-import')){
                let rBlock = target.closest('.rm-block');
                let links = rBlock.querySelectorAll('.rm-block a:not(.rm-alias--page):not(.rm-alias--block)');
                let urlList = Array.from(links).map(l => l.href);
                zoteroRoam.webImport.currentBlock = rBlock.querySelector('.rm-block-main .roam-block');

                // Open the dialog before harvesting the metadata, show loading state
                let overlay = document.querySelector('.zotero-roam-auxiliary-overlay');
                overlay.querySelector('.main-panel .header-left').innerHTML = `
                <div class="bp3-spinner">
                    <div class="bp3-spinner-animation">
                        <svg width="20" height="20" stroke-width="8.00" viewBox="1.00 1.00 98.00 98.00">
                            <path class="bp3-spinner-track" d="M 50,50 m 0,-45 a 45,45 0 1 1 0,90 a 45,45 0 1 1 0,-90"></path>
                            <path class="bp3-spinner-head" d="M 50,50 m 0,-45 a 45,45 0 1 1 0,90 a 45,45 0 1 1 0,-90" pathLength="280" stroke-dasharray="280 280" stroke-dashoffset="210"></path>
                        </svg>
                    </div>
                </div>`;
                overlay.querySelector('.main-panel .rendered-div').innerHTML = ``;
                overlay.querySelector('.bp3-dialog').setAttribute('side-panel', 'visible');
                zoteroRoam.interface.triggerImport(type = "weblinks");
                overlay.style.display = "block";
                overlay.setAttribute("overlay-visible", "true");

                // Request metadata
                let citoidList = [];
                urlList.forEach(url => {
                    citoidList.push(zoteroRoam.handlers.requestCitoid(query = url));
                });
                let harvest = await Promise.all(citoidList);
                zoteroRoam.webImport.activeImport = {
                    items: null
                }
                let successes = harvest.filter(cit => cit.success == true);
                zoteroRoam.webImport.activeImport.harvest = successes;
                if(successes.length > 0){
                    zoteroRoam.interface.fillWebImportDialog(successes);
                } else {
                    overlay.querySelector('.main-panel .header-left').innerHTML = `<p>No data successfully retrieved</p>`;
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
            let itemDOI = zoteroRoam.utils.parseDOI(item.data.DOI) || "";
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
                try{
                    if(menu_defaults.includes("citingPapers") && itemDOI){
                        citeObject = await zoteroRoam.handlers.getSemantic(itemDOI);
                        if(citeObject.data){
                            let citingDOIs = citeObject.citations.map(cit => zoteroRoam.utils.parseDOI(cit.doi)).filter(Boolean);
                            let citedDOIs = citeObject.references.map(ref => zoteroRoam.utils.parseDOI(ref.doi)).filter(Boolean);
                            let allDOIs = [...citingDOIs, ...citedDOIs];
                            if(allDOIs.length > 0){
                                let doisInLib = zoteroRoam.data.items.filter(it => zoteroRoam.utils.parseDOI(it.data.DOI));
                                let papersInLib = allDOIs.map(doi => doisInLib.find(it => zoteroRoam.utils.parseDOI(it.data.DOI) == doi)).filter(Boolean);
                                papersInLib.forEach((paper, index) => {
                                    if(citingDOIs.includes(paper.data.DOI)){
                                        papersInLib[index].type = "citing";
                                    } else {
                                        papersInLib[index].type = "cited";
                                    }
                                });
                                backlinksLib = "";
                                backlinksLib += zoteroRoam.utils.renderBP3Button_group(string = `${citeObject.references.length > 0 ? citeObject.references.length : "No"} references`, {buttonClass: "bp3-minimal bp3-intent-primary zotero-roam-page-menu-references-total", icon: "citation", buttonAttribute: `data-doi="${itemDOI}" data-citekey="${itemCitekey}" aria-label="Show available references" ${citedDOIs.length > 0 ? "" : "disabled aria-disabled='true'"}`});
                                backlinksLib += zoteroRoam.utils.renderBP3Button_group(string = `${citeObject.citations.length > 0 ? citeObject.citations.length : "No"} citing papers`, {buttonClass: "bp3-minimal bp3-intent-warning zotero-roam-page-menu-backlinks-total", icon: "chat", buttonAttribute: `data-doi="${itemDOI}" data-citekey="${itemCitekey}" aria-label="Show available citing papers" ${citingDOIs.length > 0 ? "" : "disabled aria-disabled='true'"}`});
                                backlinksLib += zoteroRoam.utils.renderBP3Button_group(string = `${papersInLib.length > 0 ? papersInLib.length : "No"} related library items`, {buttonClass: `${papersInLib.length > 0 ? "" : "bp3-disabled"} bp3-minimal zotero-roam-page-menu-backlinks-button`, icon: "caret-down bp3-icon-standard rm-caret rm-caret-closed", buttonAttribute: `aria-label="Show related items present in Zotero library" aria-controls="zr-backlinks-list-${itemCitekey}" ${papersInLib.length > 0 ? "" : "aria-disabled='true'"}`});
            
                                if(papersInLib.length > 0){
                                    backlinksLib += `
                                    <ul id="zr-backlinks-list-${itemCitekey}" class="zotero-roam-page-menu-backlinks-list bp3-list-unstyled" style="display:none;">
                                    ${zoteroRoam.inPage.renderBacklinksList_year(papersInLib, origin_year = item.meta.parsedDate ? new Date(item.meta.parsedDate).getUTCFullYear() : "")}
                                    </ul>
                                    `
                                }
                            }
                        }
                    }
                } catch(e){
                    console.log(`Citations rendering error : ${e}`);
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

        renderCitekeyRefs(){
            let refCitekeys = document.querySelectorAll("span[data-link-title^='@']");
            for(i=0;i<refCitekeys.length;i++){
              let refCitekeyElement = refCitekeys[i];
              let linkElement = refCitekeyElement.getElementsByClassName('rm-page-ref')[0];
              let keyStatus = refCitekeyElement.getAttribute('data-zotero-bib');
              let citekey = refCitekeyElement.getAttribute('data-link-title').slice(1);
              
              if(keyStatus == "inLibrary"){
                let libItem = zoteroRoam.data.items.find(it => it.key == citekey);
                if(libItem){
                     linkElement.textContent = zoteroRoam.utils.formatItemReference(libItem, "inline"); 
                } else if(linkElement.textContent != '@' + citekey){
                      linkElement.textContent = '@' + citekey;  
                }
              } else if(linkElement.textContent != '@' + citekey){
                linkElement.textContent = '@' + citekey;
              }
            }
        },

        renderBacklinksItem_year(paper, type, uid = null){
            let accent_class = type == "reference" ? "zr-highlight" : "zr-highlight-2";
            let intent = type == "reference" ? "bp3-intent-primary" : "bp3-intent-warning";
            if(uid){
                return `
                <li class="related-item_listed" item-type="${type}" data-key="@${paper.key}" data-item-type="${paper.data.itemType}" data-item-year="${paper.meta.parsedDate ? new Date(paper.meta.parsedDate).getUTCFullYear() : ""}" in-graph="true">
                    <div class="related_year">${paper.meta.parsedDate ? new Date(paper.meta.parsedDate).getUTCFullYear() : ""}</div>
                    <div class="related_info">
                        <span class="zotero-roam-search-item-authors ${accent_class}">${paper.meta.creatorSummary || ""}</span><span class="zr-secondary">${paper.data.publicationTitle || paper.data.bookTitle || ""}</span>
                        <a class="zotero-roam-search-item-title" href="${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${uid}">
                            ${paper.data.title}
                        </a>
                    </div>
                    <div class="related_state">
                        ${zoteroRoam.utils.renderBP3Button_group(string = "", {buttonClass: `bp3-minimal zr-text-small ${intent} zotero-roam-page-menu-backlink-open-sidebar`, icon: "inheritance", buttonAttribute: `data-uid="${uid}" title="Open in sidebar" aria-label="Open @${paper.key} in the sidebar"`})}
                    </div>
                </li>`;
            } else {
                return `
                <li class="related-item_listed" item-type="${type}" data-key="@${paper.key}" data-item-type="${paper.data.itemType}" data-item-year="${paper.meta.parsedDate ? new Date(paper.meta.parsedDate).getUTCFullYear() : ""}" in-graph="false">
                <div class="related_year">${paper.meta.parsedDate ? new Date(paper.meta.parsedDate).getUTCFullYear() : ""}</div>
                <div class="related_info">
                    <span class="zotero-roam-search-item-authors ${accent_class}">${paper.meta.creatorSummary || ""}</span><span class="zr-secondary">${paper.data.publicationTitle || paper.data.bookTitle || ""}</span>
                    <span class="zotero-roam-search-item-title">${paper.data.title}</span>
                </div>
                <div class="related_state">
                    ${zoteroRoam.utils.renderBP3Button_group(string = `@${paper.key}`, {buttonClass: `bp3-minimal zr-text-small zotero-roam-page-menu-backlink-add-sidebar`, icon: "plus", buttonAttribute: `data-title="@${paper.key}" title="Add & open in sidebar" aria-label="Add & open @${paper.key} in the sidebar"`})}
                </div>
                </li>`
            }
        },

        renderBacklinksItem(paper, type, uid = null){
            let icon = type == "reference" ? "citation" : "chat";
            let accent_class = type == "reference" ? "zr-highlight" : "zr-highlight-2";
            if(uid){
                return `
                <li class="related-item_listed" item-type="${type}" data-key="@${paper.key}" in-graph="true">
                <div class="related_info">
                <a class="related_info-wrapper" href="${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${uid}"><span><span class="bp3-icon bp3-icon-${icon}"></span>${zoteroRoam.utils.formatItemReference(paper, "zettlr_accent", {accent_class: accent_class})}</span></a>
                </div>
                <div class="related_state">
                ${zoteroRoam.utils.renderBP3Button_group(string = "", {buttonClass: "bp3-minimal zotero-roam-page-menu-backlink-open-sidebar", icon: "inheritance", buttonAttribute: `data-uid="${uid}" title="Open in sidebar"`})}
                </div>
                </li>`;
            } else {
                return `
                <li class="related-item_listed" item-type="${type}" data-key="@${paper.key}" in-graph="false">
                <div class="related_info">
                <span class="related_info-wrapper"><span class="bp3-icon bp3-icon-${icon}"></span>${zoteroRoam.utils.formatItemReference(paper, "zettlr_accent", {accent_class: accent_class})}</span>
                </div>
                <div class="related_state">
                ${zoteroRoam.utils.renderBP3Button_group(string = "", {buttonClass: "bp3-minimal zotero-roam-page-menu-backlink-add-sidebar", icon: "add", buttonAttribute: `data-title="@${paper.key}" title="Add & open in sidebar"`})}
                </div>
                </li>`
            }
        },

        renderBacklinksList_year(papers, origin_year){
            let papersInGraph = new Map(zoteroRoam.utils.getAllRefPages());
            let papersList = papers.sort((a,b) => {
                if(!a.meta.parsedDate){
                    if(!b.meta.parsedDate){
                        return a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1;
                    } else {
                        return 1;
                    }
                } else {
                    if(!b.meta.parsedDate){
                        return -1;
                    } else {
                        let date_diff = new Date(a.meta.parsedDate).getUTCFullYear() - new Date(b.meta.parsedDate).getUTCFullYear();
                        if(date_diff < 0){
                            return -1;
                        } else if(date_diff == 0){
                            return a.meta.creatorSummary < b.meta.creatorSummary ? -1 : 1;
                        } else {
                            return 1;
                        }
                    }
                }
            });
            let referencesList = papersList.filter(p => p.type == "cited").map(p => {
                let paperUID = papersInGraph.get('@' + p.key) || null;
                return zoteroRoam.inPage.renderBacklinksItem_year(p, "reference", uid = paperUID);
            });
            let citationsList = papersList.filter(p => p.type == "citing").map(p => {
                let paperUID = papersInGraph.get('@' + p.key) || null;
                return zoteroRoam.inPage.renderBacklinksItem_year(p, "citation", uid = paperUID);
            });

            return `
            <ul class="related-sublist bp3-list-unstyled" list-type="references">
                ${referencesList.join("\n")}
            </ul>
            <span class="backlinks-list_divider">
                <span class="bp3-tag bp3-minimal">${origin_year}</span>
                <hr>
            </span>
            <ul class="related-sublist bp3-list-unstyled" list-type="citations">
                ${citationsList.join("\n")}
            </ul>
            `;
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
        },

        addWebImport(){
            let tags = zoteroRoam.config.params.webimport.tags;
            // Allow for multiple trigger tags
            let tagList = tags.constructor === Array ? tags : [tags];
            // Template for button
            let exploBtn = document.createElement('button');
            exploBtn.setAttribute('type', 'button');
            exploBtn.classList.add('bp3-button');
            exploBtn.classList.add('bp3-minimal');
            exploBtn.classList.add('zotero-roam-explo-import');
            exploBtn.innerHTML = `<span icon="geosearch" class="bp3-icon bp3-icon-geosearch"></span>`;
            // Get all blocks with trigger tags
            let trigBlocks = Array.from(document.querySelectorAll('.rm-block:not(.rm-block--ghost)')).filter(b => zoteroRoam.utils.matchArrays(tagList, JSON.parse(b.getAttribute('data-page-links'))));
            trigBlocks.forEach(b => {
                let links = b.querySelectorAll('.rm-block a:not(.rm-alias--page):not(.rm-alias--block)');
                let firstElem = b.firstChild;
                if(links.length > 0){
                    b.setAttribute('data-zr-explo', 'true');
                    if(!Array.from(firstElem.classList).includes('zotero-roam-explo-import')){
                        b.insertAdjacentElement('afterbegin', exploBtn.cloneNode(true));
                    }
                } else {
                    b.setAttribute('data-zr-explo', 'false');
                    if(Array.from(firstElem.classList).includes('zotero-roam-explo-import')){
                        firstElem.remove();
                    }
                }
            })
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
                            return creatorTag + (creator.type == "author" ? "" : ` (${creator.type})`);
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
            let children = zoteroRoam.data.items.filter(i => i.data.parentItem == item.data.key & i.library.id == item.library.id);
            if(children.length > 0){
                return children;
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

            let childrenInDataset = zoteroRoam.formatting.getChildrenInDataset(item);
            if(!childrenInDataset){
                if(item.meta.numChildren > 0){
                    childrenObject.remoteChildren = true;
                }
            } else {
                itemChildren = childrenInDataset;
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

        getItemRelated(item, {return_as = "citekeys", brackets = true} = {}){
            if(item.data.relations && item.data.relations['dc:relation']){
                let relatedItems = item.data.relations['dc:relation'];
                if(relatedItems.constructor === String){ relatedItems = [relatedItems] };
                
                let output = [];
                let relRegex = /(users|groups)\/([^\/]+)\/items\/(.+)/g;
                
                relatedItems.forEach(itemURI => {
                  let [uri, libType, libID, itemKey] = Array.from(itemURI.matchAll(relRegex))[0];
                  libType = libType.slice(0,-1);
                  libID = new Number(libID);
                  let libItem = null;
                  for(let j = 0; j < zoteroRoam.data.items.length;j++){
                      let elem = zoteroRoam.data.items[j];
                      if(elem.library.type == libType && elem.library.id == libID && elem.data.key == itemKey){
                          libItem = elem;
                          break;
                      }
                  }
                  if(libItem){ output.push(libItem) };
                });
                
                switch(return_as){
                  case "raw":
                    return output;
                  case "citekeys":
                  default:
                    return brackets ? output.map(i => `[[@${i.key}]]`) : output.map(i => i.key);
                }
            } else {
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
            let libLoc = item.library.type == "group" ? `groups/${item.library.id}` : `library`;
            let target = `zotero://select/${libLoc}/items/${item.data.key}`;
            switch(format){
                case "target":
                default:
                    return target;
                case "markdown":
                    return `[${text}](${target})`;
            }
        },

        getWebLink(item, {format = "markdown", text = "Web library"} = {}){
            let libLoc = ((item.library.type == "user") ? "users" : "groups") + `/${item.library.id}`;
            let target = `https://www.zotero.org/${libLoc}/items/${item.data.key}`;
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
            metadata.push(`Zotero links:: ${zoteroRoam.formatting.getLocalLink(item, {format = "markdown", text = "Local library"})}, ${zoteroRoam.formatting.getWebLink(item, {format = "markdown", text = "Local library"})}`); // Local + Web links to the item
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
                        } else if(Array.from(openOverlay.classList).includes("zotero-roam-auxiliary-overlay")){
                            zoteroRoam.interface.closeAuxiliaryOverlay();
                        }
                    }
                }
            },
            toggleSearchPanel: {
                defaultShortcut: {altKey: true, 'q': true},
                execute(){
                    if(zoteroRoam.interface.citations.overlay.getAttribute("overlay-visible") == "true"){
                        zoteroRoam.interface.closeCitationsOverlay();
                    } else if(document.querySelector('.zotero-roam-auxiliary-overlay').getAttribute("overlay-visible") == "true"){
                        zoteroRoam.interface.closeAuxiliaryOverlay();
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
                    let goToPageEl = document.querySelector("button.item-go-to-page");
                    if(goToPageEl && zoteroRoam.interface.search.overlay.getAttribute("overlay-visible") == "true"){
                        let pageUID = goToPageEl.getAttribute('data-uid');
                        let itemKey = '@' + goToPageEl.getAttribute('data-citekey');
                        console.log(`Navigating to ${itemKey} (${pageUID})`);
                        roamAlphaAPI.ui.mainWindow.openPage({page: {uid: pageUID}});
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

            // Overlay Panels : toggle, close
            let toggleSeqText = (zoteroRoam.shortcuts.sequences["toggleSearchPanel"]) ? zoteroRoam.shortcuts.makeSequenceText("toggleSearchPanel", pre = "Toggle panel with ") : "";
            let closeSeqText = (zoteroRoam.shortcuts.sequences["closeSearchPanel"]) ? zoteroRoam.shortcuts.makeSequenceText("closeSearchPanel", pre = "Exit with ") : "";
            if(toggleSeqText.length > 0 | closeSeqText.length > 0){
                let spanSeqs = document.createElement('span');
                spanSeqs.style = `font-size:0.8em;margin:3px;`;
                spanSeqs.innerHTML = `${[toggleSeqText, closeSeqText].filter(Boolean).join(" / ")}  `;
                let searchTopControls = zoteroRoam.interface.search.overlay.querySelector(`.controls-top`);
                searchTopControls.insertBefore(spanSeqs, zoteroRoam.interface.search.closeButton);

                if(closeSeqText.length > 0){
                    let citationsSearchTopControls = zoteroRoam.interface.citations.overlay.querySelector(`.controls-top`);
                    let spanSeq = document.createElement('span');
                    spanSeq.style = `font-size:0.8em;margin:6px;`;
                    spanSeq.innerHTML = `${closeSeqText}`;
                    citationsSearchTopControls.insertBefore(spanSeq, zoteroRoam.interface.citations.closeButton);

                    let auxiliaryTopControls = document.querySelector('.zotero-roam-auxiliary-overlay .controls-top');
                    let auxSpanSeq = spanSeq.cloneNode(true);
                    auxiliaryTopControls.insertBefore(auxSpanSeq, auxiliaryTopControls.querySelector('.bp3-dialog-close-button'));
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
    zoteroRoam.events = {
        /**
         * Signals the extension has loaded successfully
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
                let itemKey = e.detail.title;
                let pageUID = e.detail.uid;

                // Update item-in-graph display, if applicable
                try {
                    let inGraphDiv = document.querySelector(".item-in-graph");
                    if(inGraphDiv != null){
                        inGraphDiv.innerHTML = `<span class="bp3-icon-tick bp3-icon bp3-intent-success"></span><span> In the graph</span>`;
                    }
                    let goToPageButton = document.querySelector(".item-go-to-page");
                    if(goToPageButton != null){
                        goToPageButton.setAttribute("data-uid", pageUID);
                        goToPageButton.removeAttribute("disabled");
                    }
                } catch(e){};
                // Update auxiliary dialog, if applicable
                try {
                    let auxItem = document.querySelector(`.zotero-roam-auxiliary-overlay .bp3-menu-item[label="${itemKey.slice(1)}"]`);
                    if(auxItem != null){
                        auxItem.setAttribute('in-graph', 'true');
                        // Remove the "Add to graph" button
                        auxItem.querySelector('.zotero-roam-add-to-graph').remove();
                        // Insert the "Go to page" button
                        auxItem.innerHTML += zoteroRoam.utils.renderBP3ButtonGroup("Go to page", {buttonClass: "zotero-roam-list-item-go-to-page", divClass: "bp3-minimal bp3-small", icon: "symbol-circle", modifier: "bp3-intent-success", buttonModifier: `data-uid="${pageUID}" data-citekey="${itemKey.slice(1)}"`});
                    }
                } catch(e){};
                // Update on-page menu backlink, if applicable
                try {
                    let backlinks = Array.from(document.querySelectorAll(`.related-item_listed[data-key="${itemKey}"][in-graph="false"]`));
                    if(backlinks.length > 0){
                        for(link of backlinks){
                            link.outerHTML = zoteroRoam.inPage.renderBacklinksItem(paper = e.detail.item, type = link.getAttribute('item-type'), uid = pageUID);
                        }
                    }
                } catch(e){};
            });

            document.addEventListener("zotero-roam:update", async function(e){
                // Refresh DOM elements on the page
                let updatedItems = e.detail.data ? e.detail.data.items : [];
                if(updatedItems.length > 0){
                    for(item of updatedItems){
                        let itemDOI = zoteroRoam.utils.parseDOI(item.data.DOI);
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
                                            btn.setAttribute('data-keys', JSON.stringify([...btnKeys, item.key]));
                                        } else {
                                            // Special case where the item's citekey was updated
                                            btn.setAttribute('data-keys', JSON.stringify([...btnKeys.filter(k => k != item.data.key), item.key]));
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
                        if(itemDOI && zoteroRoam.config.params.pageMenu.defaults.includes("citingPapers")){
                            let pageMenus = Array.from(document.querySelectorAll('.zotero-roam-page-menu-citations[data-doi]'));
                            for(menu of pageMenus){
                                let doi = menu.dataset.doi;
                                let citeObject = await zoteroRoam.handlers.getSemantic(doi);
                                if(citeObject.data){
                                    let citingDOIs = citeObject.citations.map(cit => zoteroRoam.utils.parseDOI(cit.doi)).filter(Boolean);
                                    let citedDOIs = citeObject.references.map(ref => zoteroRoam.utils.parseDOI(ref.doi)).filter(Boolean);
                                    let allDOIs = [...citingDOIs, ...citedDOIs];
                                    if(allDOIs.includes(itemDOI)){
                                        let doisInLib = zoteroRoam.data.items.filter(it => zoteroRoam.utils.parseDOI(it.data.DOI));
                                        let papersInLib = allDOIs.map(doi => doisInLib.find(it => zoteroRoam.utils.parseDOI(it.data.DOI) == doi)).filter(Boolean);
                                        papersInLib.forEach((it, index) => {
                                            if(citingDOIs.includes(it.data.DOI)){
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
                // Refresh tag lists
                zoteroRoam.utils.refreshTagLists();
                // --- Deleted items
            });

            document.addEventListener("zotero-roam:ready", (e) => {
                // Create tag lists
                zoteroRoam.utils.refreshTagLists();
                zoteroRoam.utils.updateTagPagination(libPath = Array.from(zoteroRoam.data.libraries.keys())[0]);
            });
        }
    }
})();

;(()=>{
    zoteroRoam.smartblocks = {
        commands: {
            'ZOTERORANDOMCITEKEY': {
                help: "Return one or more Zotero citekeys, with optional tag query",
                handler: (context) => (nb = '1', query='') => {
                    return zoteroRoam.data.items
                      .filter(it => !['attachment', 'note', 'annotation'].includes(it.data.itemType) && zoteroRoam.smartblocks.processQuery(query, it.data.tags.map(t => t.tag)))
                      .map(it => it.key)
                      .sort(() => 0.5 - Math.random())
                      .slice(0, Number(nb) || 1)
                }
            }
        },
        // Extension commands : utility functions
        processQuery(query, props){
            let components = query.split(/([\|\&]?)([^\&\|\(\)]+|\(.+\))([\|\&]?)/).filter(Boolean);
            if(components.includes("|")){
              return zoteroRoam.smartblocks.eval_or(components.filter(c => c != "|"), props);
            } else {
              return zoteroRoam.smartblocks.eval_and(components.filter(c => c!= "&"), props);
            }
        },

        eval_and(terms, props){
            let outcome = true;
            for(let i=0;i<terms.length && outcome == true;i++){
              outcome = zoteroRoam.smartblocks.eval_term(terms[i], props);
            }
            return outcome;
        },
          
        eval_or(terms, props){
            let outcome = false;
            for(let i=0;i<terms.length && outcome == false;i++){
              outcome = zoteroRoam.smartblocks.eval_term(terms[i], props);
            }
            return outcome;
        },

        eval_term(term, props){
            if(term.startsWith("(") && term.endsWith(")")){
              // If the term was a (grouping), strip the outer parentheses & send to processing
              let clean_str = term.slice(1, -1);
              return zoteroRoam.smartblocks.processQuery(clean_str, props);
            } else {
                if(term.startsWith("-")){
                    let clean_str = term.slice(1);
                    return !props.includes(clean_str);
                } else {
                    return props.includes(term);
                }
            }
        },
        registerCommands(){
            Object.keys(zoteroRoam.smartblocks.commands).forEach(k => {
                let {help, handler} = zoteroRoam.smartblocks.commands[`${k}`];
                window.roamjs.extension.smartblocks.registerCommand({
                    text: k,
                    help: help,
                    handler: handler
                })
            });
        },
        // Extension-triggered Smartblocks
        async use_smartblock_metadata(config, context){
            let obj = config;
            obj.targetUid = context.uid;
            if(!obj.variables){ obj.variables = {} };
            Object.keys(context).forEach(k => {
                obj.variables[`${k}`] = context[`${k}`];
            });
            try {
                await window.roamjs.extension.smartblocks.triggerSmartblock(obj);
                return {
                    success: true
                }
            } catch(e){
                console.log(e);
                return {
                    success: false
                }
            }
        }
    };
})();
;(()=>{
    // This code will run on re/load
    // It contains the interactive portion of the setup (reading user specifications, and setting up certain objects accordingly)
    if (typeof(window.zoteroRoam_settings) !== 'undefined') {
        // Get user settings
        zoteroRoam.config.userSettings = window.zoteroRoam_settings;
        if(zoteroRoam.config.userSettings.theme){
            zoteroRoam.config.params.theme = zoteroRoam.config.userSettings.theme;
        }
        // Add DOM interface elements + set them up
        zoteroRoam.interface.create();
        zoteroRoam.interface.setup();
        zoteroRoam.addExtensionCSS();
        window.addEventListener("hashchange", () => { 
            zoteroRoam.interface.toggleSearchOverlay("hide");
            zoteroRoam.interface.closeAuxiliaryOverlay();
        });

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
            let {defaults, trigger} = zoteroRoam.config.userSettings.pageMenu;
            if(defaults){ zoteroRoam.config.params.pageMenu.defaults = defaults };
            if(trigger && typeof(trigger) == "function"){ zoteroRoam.config.params.pageMenu.trigger = trigger };
        }

        if(zoteroRoam.config.userSettings.webimport){
            let {tags = []} = zoteroRoam.config.userSettings.webimport;
            zoteroRoam.config.params.webimport.tags = tags;
        }
        
        zoteroRoam.shortcuts.setup();
        zoteroRoam.shortcuts.setupSequences();
        zoteroRoam.handlers.setupUserRequests();
        zoteroRoam.events.defaultHooks();

        if(zoteroRoam.config.userSettings.autoload == true){
            setTimeout(function(){zoteroRoam.extension.load()}, 1000);
        }

    } else {
        throw new Error("A zoteroRoam_settings object must be defined in order to use the extension. Read through the docs for basic setup examples.");
    }
})();
