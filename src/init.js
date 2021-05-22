
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
            this.nbPages = Math.ceil(obj.data.length / obj.itemsPerPage);
            this.startIndex = (this.currentPage - 1)*this.itemsPerPage + 1;

            this.getCurrentPageData = function(){
                return this.getPageData(this.currentPage);
            }

            this.getPageData = function(n){
                return this.data.slice(start = this.itemsPerPage*(n - 1), end = this.itemsPerPage*n);
            }

            this.previousPage = function(){
                this.currentPage -= 1;
                if(this.currentPage < 1){ this.currentPage = 1};
                return this.getCurrentPageData();
            }

            this.nextPage = function(){
                this.currentPage += 1;
                if(this.currentPage > this.nbPages){ this.currentPage = this.nbPages};
                return this.getCurrentPageData();
            }
        },

        data: {items: [], collections: [], scite: []},

        autoComplete: null,

        citations: {pagination: null, autocomplete: null},

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
                    key: ['title', 'authorsLastNames', 'year', 'tagsString', 'key', '_multiField'],
                    cache: false,
                    results: (list) => {
                        // Make sure to return only one result per item in the dataset, by gathering all indices & returning only the first match for that index
                        // Records are sorted alphabetically (by key name) => _multiField should come last
                        const filteredMatches = Array.from(new Set(list.map((item) => item.index))).map((index) => {
                            return list.filter(item => item.index === index).sort((a,b) => {
                                return zoteroRoam.config.autoComplete.data.key.findIndex(key => key == a.key) < zoteroRoam.config.autoComplete.data.key.findIndex(key => b.key) ? -1 : 1;
                            })[0];
                        });
                        return filteredMatches;
                    }
                },
                selector: '#zotero-search-autocomplete',
                searchEngine: (query, record) => {
                    return zoteroRoam.utils.multiwordMatch(query, record);
                },
                trigger: {
                    event: ["input", "focus"]
                },
                highlight: true,
                maxResults: 100,
                sort: (a, b) => { // Sort by author, alphabetically
                    if(a.value.authors.toLowerCase() < b.value.authors.toLowerCase()) return -1;
                    if(a.value.authors.toLowerCase() > b.value.authors.toLowerCase()) return 1;
                    return 0;
                },
                resultsList: {
                    className: "zotero-search-results-list",
                    idName: "zotero-search-results-list",
                    container: source => {
                        source.classList.add("bp3-menu");
                    }
                },
                resultItem: {
                    element: 'li',
                    className: "zotero-search_result",
                    idName: "zotero-search_result",
                    content: (data, element) => {
                        let itemMetadata = `<span class="zotero-search-item-metadata"> ${data.value.meta}</span>`;
                        let itemTitleContent = (data.key == "title") ? data.match : data.value.title;
                        let itemTitle = `<span class="zotero-search-item-title" style="font-weight:bold;display:block;">${itemTitleContent}</span>`;
                        
                        let itemCitekeyContent = (data.key == "key") ? data.match : data.value.key;
                        let itemCitekey = `<span class="bp3-menu-item-label zotero-search-item-key">${itemCitekeyContent}</span>`;

                        let itemYear = "";
                        if(data.value.year){
                            let itemYearContent = (data.key == "year") ? data.match : data.value.year;
                            itemYear = `<span class="zotero-search-item-year"> (${itemYearContent})</span>`;
                        }
            
                        // Prepare authors element, if there are any
                        let itemAuthors = "";
                        if(data.value.authors){
                            // If the match is in the full list of authors, manually add the .autoComplete_highlighted class to the abbreviated authors span
                            if(data.key == "authorsLastNames"){
                                itemAuthors = `<span class="zotero-search-item-authors autoComplete_highlighted">${data.value.authors}</span>`;
                            } else {
                                itemAuthors = `<span class="zotero-search-item-authors">${data.value.authors}</span>`;
                            }
                        }
                        // Prepare tags element, if there are any
                        let itemTags = "";
                        if(data.value.tagsString){
                            let itemTagsContent = (data.key == "tagsString") ? data.match : data.value.tagsString;
                            itemTags = `<span class="zotero-search-item-tags" style="font-style:italic;color:#c1c0c0;display:block;">${itemTagsContent}</span>`;
                        }
            
                        // Render the element's template
                        element.innerHTML = `<a label="${data.value.key}" class="bp3-menu-item bp3-popover-dismiss">
                                            <div class="bp3-text-overflow-ellipsis bp3-fill zotero-search-item-contents">
                                            ${itemTitle}
                                            ${itemAuthors}${itemYear}${itemMetadata}
                                            ${itemTags}
                                            </div>
                                            ${itemCitekey}
                                            </a>`;
              
                    }
                },
                noResults: (dataFeedback, generateList) => {
                    // Generate autoComplete List
                    generateList(zoteroRoam.autoComplete, dataFeedback, dataFeedback.results);
                    // No Results List Item
                    const result = document.createElement("li");
                    result.setAttribute("class", "no_result");
                    result.setAttribute("tabindex", "1");
                    result.innerHTML = `<span style="display: flex; align-items: center; font-weight: 100; color: rgba(0,0,0,.2);">Found No Results for "${dataFeedback.query}"</span>`;
                    document
                        .querySelector(`#${zoteroRoam.autoComplete.resultsList.idName}`)
                        .appendChild(result);
                },
                onSelection: (feedback) => {
                    zoteroRoam.interface.search.input.blur();
                    let quickCopyEnabled = document.querySelector("#zotero-quick-copy-mode").checked;
                    if(zoteroRoam.config.params.always_copy == true || (quickCopyEnabled && !zoteroRoam.config.params.override_quickcopy.overridden)){
                        let clipboard = document.querySelector("input.clipboard-copy-utility");
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
                            zoteroRoam.interface.renderSelectedItem(feedback);
                        }
                    } else {
                        zoteroRoam.interface.renderSelectedItem(feedback);
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
                }
            },
            requests: {}, // Assigned the processed Array of requests (see handlers.setupUserRequests)
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
            autoCompleteCSS.textContent = `ul.zotero-search-results-list::before{content:attr(aria-label);}
                                            li.autoComplete_selected{background-color:#e7f3f7;}
                                            span.autoComplete_highlighted{color:#146cb7;}
                                            .selected-item-header, .selected-item-body{display:flex;justify-content:space-around;}
                                            .selected-item-header{margin-bottom:20px;}
                                            .selected-item-body{flex-wrap:wrap;}
                                            .item-basic-metadata, .item-additional-metadata{flex: 0 1 60%;}
                                            .item-rendered-notes{flex: 0 1 95%;margin-top:25px;}
                                            .item-citekey, .item-actions{flex:0 1 30%;}
                                            .item-citekey{margin:10px 0px;}
                                            .item-citekey .copy-buttons .bp3-button{font-size:0.7em;flex-wrap:wrap;}
                                            span.zotero-roam-sequence{background-color:khaki;padding:3px 6px;border-radius:3px;font-size:0.85em;font-weight:normal;}
                                            .zotero-roam-tribute {max-width:800px;max-height:300px;overflow:scroll;margin-top:5px;}
                                            .zotero-roam-tribute ul {list-style-type:none;padding:0px;background-color: white;border:1px #e4e4e4 solid; border-radius:2px;}
                                            .zotero-roam-tribute ul li {padding: 2px 5px;font-weight:300;}
                                            .zotero-roam-tribute-selected {background-color: #4f97d4;color:white;}
                                            .zotero-roam-page-div{display:flex;justify-content:space-between;border:1px #eaeaea solid;padding:10px;border-radius:5px;background-color: #eaf4ff;}
                                            .zotero-roam-page-menu{padding-bottom:15px;flex: 0 1 75%;display:block;}
                                            .zotero-roam-page-menu hr{margin:2px 0;}
                                            .scite-badge{padding-top:5px;}
                                            .scite-badge[style*='position: fixed; right: 1%;'] {display: none!important;}
                                            .zotero-roam-page-menu-backlinks-list{list-style-type:none;}`;
            document.head.append(autoCompleteCSS);
        }

    };

    // Load the autoComplete JS (if there's a better way, I'm all ears)
    // This should be done early on so that the autoComplete constructor is available & ready
    var ac = document.createElement("script");
    ac.src = "https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@8.3.2/dist/js/autoComplete.js";
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
