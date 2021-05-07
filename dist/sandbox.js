
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

        data: {items: [], collections: []},

        autoComplete: null,

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

        addAutoCompleteCSS(){
            let autoCompleteCSS = document.createElement('style');
            autoCompleteCSS.textContent = `ul#zotero-search-results-list::before{content:attr(aria-label);}
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
                                            .scite-badge{padding-top:5px;}
                                            .scite-badge[style*='position: fixed; right: 1%;'] {display: none!important;}`;
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

;(()=>{
    zoteroRoam.utils = {

        addBlock(uid, blockString, order = 0) {
            window.roamAlphaAPI.createBlock({ 'location': { 'parent-uid': uid, 'order': order }, 'block': { 'string': blockString } });
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

        formatItemNotes(arr, {split_char = "\n"} = {}){
            if(arr.length == 0){
                return false;
            } else {
                return arr.map(n => {
                    // Split into blocks on newline
                    let noteBlocks = n.data.note.split(split_char);
                    return noteBlocks.map(b => zoteroRoam.utils.parseNoteBlock(b)).filter(b => b.trim());
                });
            }
        },

        formatItemReference(item, format){
            switch(format){
                case 'tag':
                    return `#[[@${item.key}]]`;
                case 'pageref':
                    return `[[@${item.key}]]`;
                case 'citation':
                    let citeText = item.meta.creatorSummary || ``;
                    citeText = item.meta.parsedDate ? `${citeText} (${new Date(item.meta.parsedDate).getFullYear()})` : citeText;
                    citeText = `[${(citeText.length > 0) ? citeText : item.key}]([[@${item.key}]])`
                    return citeText;
                case 'zettlr':
                    return (item.meta.creatorSummary || ``) + (item.meta.parsedDate ? ` (${new Date(item.meta.parsedDate).getFullYear()})` : ``) + ` : ` + item.data.title;
                case 'citekey':
                default:
                    return `@${item.key}`;
            }
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

        // Given an Array of PDF items, returns an Array of Markdown-style links. If a PDF is a `linked_file` or `imported_file`, make a local Zotero open link / else, make a link to the URL
        makePDFLinks(arr){
            if(arr.length > 0){
                return arr.map(i => (["linked_file", "imported_file", "imported_url"].includes(i.data.linkMode)) ? `[${i.data.filename || i.data.title}](zotero://open-pdf/library/items/${i.data.key})` : `[${i.data.title}](${i.data.url})`);
            } else {
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

            // HTML tags that might have attributes : p, div
            let richTags = ["p", "div", "span"];
            richTags.forEach(tag => {
                let tagRegex = new RegExp(`<${tag}>|<${tag} .+?>`, "g"); // Covers both the simple case : <tag>, and the case with modifiers : <tag :modifier>
                cleanBlock = cleanBlock.replaceAll(tagRegex, "");
            })

            let linkRegex = /<a href="(.+?)">(.+?)<\/a>/g;
            cleanBlock = cleanBlock.replaceAll(linkRegex, `[$2]($1)`);
        
            return cleanBlock;
        },

        renderBP3Button_group(string, {buttonClass = "", icon = "", modifier = ""} = {}){
            return `
            <button type="button" class="bp3-button ${buttonClass}">
            <span icon="${icon}" class="bp3-icon bp3-icon-${icon} ${modifier}"></span>
            <span class="bp3-button-text">${string}</span>
            </button>
            `;
        },

        renderBP3ButtonGroup(string, {buttonClass = "", modifier = "", icon = "", buttonModifier = ""} = {}){
            return `<div class="bp3-button-group bp3-minimal bp3-fill bp3-align-left">
                    <button type="button" ${buttonModifier} class="bp3-button ${buttonClass}">
                        <span icon="${icon}" class="bp3-icon bp3-icon-${icon} ${modifier}"></span>
                            <span class="bp3-button-text">${string}</span>
                    </button>
                    </div>`;
        },
        
        renderBP3Tag(string, {modifier = "", icon = ""} = {}){
            if(icon.length > 0){
                return `<span class="bp3-tag bp3-minimal ${modifier}"><span icon="${icon}" class="bp3-icon bp3-icon-${icon}"></span><span class="bp3-text-overflow-ellipsis bp3-fill">${string}</span></span>`;
            } else {
                return `<span class="bp3-tag bp3-minimal ${modifier}" style="margin:5px;">${string}</span>`;
            }
        },

        renderHTMLBlockObject(object){
            let objectHTML = "";
            // If the Object doesn't have a string property, throw an error
            if(typeof(object.string) === 'undefined'){
                alert("Some of the input was passed as an Object but without a string property. See console for more details");
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
                    alert("Some of the input was of the wrong type. See the console for more details");
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

        async addSearchResult(title, uid){
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

        async addItemNotes(title, uid){
            let citekey = title.startsWith("@") ? title.slice(1) : title;
            let item = zoteroRoam.data.items.find(i => i.key == citekey);

            try {
                let itemChildren = zoteroRoam.formatting.getItemChildren(item, {pdf_as: "raw", notes_as: "formatted", split_char: "\n"});
                let itemNotes = itemChildren.notes.flat(1);
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
                        console.log(pageUID);
                        alert("There was a problem in obtaining the page's UID.");
                    }
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

                simplifiedItem["_multiField"] = simplifiedItem.authorsLastNames + " " + simplifiedItem.year + " " + simplifiedItem.title + " " + simplifiedItem.tagsString;
        
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

;(()=>{
    zoteroRoam.interface = {
        icon: null,
        portal: {div: null, id: "zotero-data-importer-portal"},
        contextMenu: {
            div: null,
            class: "zotero-context-menu",
            overlay: {div: null, class: "zotero-context-overlay"},
            options: {list: [], class: "zotero-context-menu-option", labels: ["Import Zotero data to page", "Convert to citation"]},
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
        tributeTrigger: ``,
        tributeBlockTrigger: null,
        tributeNewText: ``,

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
                            op.addEventListener("click", () => { zoteroRoam.handlers.addItemData(zoteroRoam.interface.contextMenu.targetElement) })
                            break;
                        case "Convert to citation":
                            op.addEventListener("click", () => { zoteroRoam.inPage.convertToCitekey(zoteroRoam.interface.contextMenu.targetElement) });
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
            // Hide default Roam context menu
            document.querySelector('body > .bp3-context-menu+.bp3-portal').style = `display:none;`;
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
                    itemInfo = itemInfo + ` (<b>${nbChildren}</b> direct children)`;
                } catch(e){};
            }
            let itemInGraph = `<div style="padding:0 10px;" class="item-in-graph"><span class="bp3-icon-${iconName} bp3-icon bp3-intent-${iconIntent}"></span><span> ${itemInfo}</span></div>`;
            
            // Render the header section
            let headerDiv = document.querySelector(".selected-item-header");
            headerDiv.innerHTML = `<div class="item-basic-metadata">
                                        <h4 class="item-title" tabindex="0">${feedback.selection.value.title}${itemYear}</h4>
                                        <p class="item-metadata-string">${divAuthors}${feedback.selection.value.meta}</p>
                                        </div>
                                    <div class="item-citekey">
                                        <div class="bp3-fill" style="font-weight:bold;padding:0 10px;">${citekey}</div>
                                        <div class="bp3-button-group bp3-fill bp3-minimal copy-buttons">
                                            <a class="bp3-button bp3-intent-primary" format="citekey">Copy @citekey ${(zoteroRoam.shortcuts.sequences["copyCitekey"]) ? zoteroRoam.shortcuts.makeSequenceText("copyCitekey") : ""}</a>
                                            <a class="bp3-button bp3-intent-primary" format="citation">[Citation]([[@]]) ${(zoteroRoam.shortcuts.sequences["copyCitation"]) ? zoteroRoam.shortcuts.makeSequenceText("copyCitation") : ""}</a>
                                            <a class="bp3-button bp3-intent-primary" format="tag">#@ ${(zoteroRoam.shortcuts.sequences["copyTag"]) ? zoteroRoam.shortcuts.makeSequenceText("copyTag") : ""}</a>
                                            <a class="bp3-button bp3-intent-primary" format="page-reference">[[@]] ${(zoteroRoam.shortcuts.sequences["copyPageRef"]) ? zoteroRoam.shortcuts.makeSequenceText("copyPageRef") : ""}</a>
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
                        let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(item.data.linkMode)) ? `zotero://open-pdf/library/items/${item.data.key}` : item.data.url;
                        let pdfLink = `<a href="${pdfHref}">${item.data.filename || item.data.title}</a>`;
                        return zoteroRoam.utils.renderBP3ButtonGroup(string = pdfLink, { icon: "paperclip" });
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

            Array.from(document.querySelectorAll('.item-citekey .copy-buttons a.bp3-button[format]')).forEach(btn => {
                btn.addEventListener("click", e => {
                    switch(btn.getAttribute('format')){
                        case 'citekey':
                            document.querySelector('input.clipboard-copy-utility').value = `${citekey}`;
                            break;
                        case 'citation':
                            let citationText = `${feedback.selection.value.authors}`;
                            if(feedback.selection.value.year){ citationText += ` (${feedback.selection.value.year})`; }
                            document.querySelector('input.clipboard-copy-utility').value = `[${citationText}]([[${citekey}]])`;
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

                let triggerRegex = new RegExp(trigger, 'g');
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
                throw new Error("The API request encountered a problem. Please check your request specification, and the console for any registered errors.");
            } else {
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
                if(zoteroRoam.autoComplete == null){
                    zoteroRoam.autoComplete = new autoComplete(zoteroRoam.config.autoComplete);
                } else {
                    zoteroRoam.autoComplete.init();
                }
                zoteroRoam.config.autoComplete.trigger.event.forEach(ev => {
                    zoteroRoam.interface.search.input.addEventListener(ev, zoteroRoam.interface.clearSelectedItem);
                })
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

                zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                console.log('The results of the API request have been received ; you can check them by inspecting the value of the zoteroRoam.data object. Data import context menu should now be available.');

            }
        },

        unload(){
            zoteroRoam.interface.icon.setAttribute("status", "off");
            zoteroRoam.data = {items: [], collections: []};
            if(zoteroRoam.autoComplete !== null){
                zoteroRoam.autoComplete.unInit();
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
            zoteroRoam.config.editingObserver.disconnect();
            window.removeEventListener("keyup", zoteroRoam.shortcuts.verify);
            window.removeEventListener("keydown", zoteroRoam.shortcuts.verify);

            zoteroRoam.interface.icon.removeAttribute("style");
            console.log('Data and request outputs have been removed');
        },
        
        toggle(){
            if(zoteroRoam.interface.icon.getAttribute('status') == "off"){
                zoteroRoam.extension.load();
            } else {
                zoteroRoam.extension.unload();
            }
        },

        async update(popup = true){
            // Turn the icon background to orange while we're updating the data
            zoteroRoam.interface.icon.style = "background-color: #fd9d0d63!important;";
            // For each request, get the latest version of any item that belongs to it
            let updateRequests = zoteroRoam.config.requests.map(rq => {
                let items = zoteroRoam.data.items.filter(i => i.requestLabel == rq.name);
                let latest = items.reduce( (f,s) => {return (f.version < s.version) ? s : f}).version;
                let {apikey, dataURI, params: setParams} = rq;
                let paramsQuery = new URLSearchParams(setParams);
                paramsQuery.set('since', latest);
                setParams = paramsQuery.toString();
                return {
                    apikey: apikey,
                    dataURI: dataURI,
                    params: setParams
                };
            });
            let updateResults = await zoteroRoam.handlers.requestData(updateRequests);
            if(updateResults.success == true){
                zoteroRoam.data.collections = updateResults.data.collections; // Collections are fetched without a 'since' parameter, so simply replacing the whole Object is fine
                
                let updatedItems = updateResults.data.items;
                if(updatedItems.length == 0){
                    if(popup) {alert("No new items were found since the data was last loaded. Data on collections was refreshed.")};
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
                        alert(`${nbNewItems} new items and ${nbModifiedItems} modified items were added to the dataset. Data on collections was refreshed.`);
                    } else{
                        console.log(`${nbNewItems} new items and ${nbModifiedItems} modified items were added to the dataset. Data on collections was refreshed.`);
                    };
                    zoteroRoam.interface.icon.style = "background-color: #60f06042!important;";
                }

            } else {
                if(popup){
                    alert("Something went wrong when updating the data. Check the console for any errors.");
                } else{
                    console.log(`${nbNewItems} new items and ${nbModifiedItems} modified items were added to the dataset. Data on collections was refreshed.`);
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

        addPageMenus(){
            let openPages = Array.from(document.querySelectorAll("h1.rm-title-display"));
            openPages.forEach(page => {
                let title = page.querySelector("span") ? page.querySelector("span").innerText : "";
                if(title.startsWith("@")){
                    let itemInLib = zoteroRoam.data.items.find(it => it.key == title.slice(1));
                    let pageInGraph = zoteroRoam.utils.lookForPage(title);
                    // If the item is in the library
                    if(typeof(itemInLib) !== 'undefined'){
                        let itemDOI = !itemInLib.data.DOI ? "" : zoteroRoam.utils.parseDOI(itemInLib.data.DOI);
                        // Check if div wrapper already exists, creates it otherwise
                        if(page.parentElement.querySelector(".zotero-roam-page-div") == null){
                            let pageDiv = document.createElement("div");
                            pageDiv.classList.add("zotero-roam-page-div");
                            page.parentElement.appendChild(pageDiv);
                        }

                        // Page menu
                        if(page.parentElement.querySelector(".zotero-roam-page-menu") == null){
                            let menuDiv = document.createElement("div");
                            menuDiv.classList.add("zotero-roam-page-menu");
                            menuDiv.classList.add("bp3-button-group");

                            let itemChildren = zoteroRoam.formatting.getItemChildren(itemInLib, { pdf_as: "raw", notes_as: "raw" });
                            let notesButton = !itemChildren.notes ? "" : zoteroRoam.utils.renderBP3Button_group(string = "Import notes", {buttonClass: "bp3-minimal zotero-roam-page-menu-import-notes", icon: "comment"});
                            let pdfButtons = !itemChildren.pdfItems ? "" : itemChildren.pdfItems.map(item => {
                                let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(item.data.linkMode)) ? `zotero://open-pdf/library/items/${item.data.key}` : item.data.url;
                                    let pdfLink = `<a href="${pdfHref}">${item.data.filename || item.data.title}</a>`;
                                    return zoteroRoam.utils.renderBP3Button_group(string = pdfLink, {buttonClass: "bp3-minimal", icon: "paperclip" });
                            });

                            let recordsButtons = [zoteroRoam.utils.renderBP3Button_group(string = `<a href="https://www.connectedpapers.com/search?q=${encodeURIComponent(itemInLib.data.title)}" target="_blank">Connected Papers</a>`, {buttonClass: "bp3-minimal zotero-roam-page-menu-connected-papers", icon: "layout"}),
                                                (!itemInLib.data.DOI) ? "" : zoteroRoam.utils.renderBP3Button_group(string = `<a href="https://api.semanticscholar.org/${itemDOI}" target="_blank">Semantic Scholar</a>`, {buttonClass: "bp3-minimal zotero-roam-page-menu-semantic-scholar", icon: "bookmark"}),
                                                zoteroRoam.utils.renderBP3Button_group(string = `<a href="https://scholar.google.com/scholar?q=${(!itemInLib.data.DOI) ? encodeURIComponent(itemInLib.data.title) : itemDOI}" target="_blank">Google Scholar</a>`, {buttonClass: "bp3-minimal zotero-roam-page-menu-google-scholar", icon: "learning"})];

                            menuDiv.innerHTML = `
                            ${zoteroRoam.utils.renderBP3Button_group(string = "Add metadata", {buttonClass: "bp3-minimal zotero-roam-page-menu-add-metadata", icon: "add"})}
                            ${notesButton}
                            ${pdfButtons}
                            ${recordsButtons.join("")}
                            `;

                            page.parentElement.querySelector(".zotero-roam-page-div").appendChild(menuDiv);

                            menuDiv.querySelector(".zotero-roam-page-menu-add-metadata").addEventListener("click", function(){
                                console.log("Importing metadata...");
                                zoteroRoam.handlers.addSearchResult(title, pageInGraph.uid);
                            });
                            try{
                                menuDiv.querySelector(".zotero-roam-page-menu-import-notes").addEventListener("click", function(){
                                    console.log("Adding notes...");
                                    zoteroRoam.handlers.addItemNotes(title = title, uid = pageInGraph.uid);
                                });
                            } catch(e){};
                        }

                        // Badge from scite.ai
                        if(itemInLib.data.DOI && page.parentElement.querySelector(".scite-badge") == null){
                            let sciteBadge = document.createElement("div");
                            sciteBadge.classList.add("scite-badge");
                            sciteBadge.setAttribute("data-doi", itemDOI);
                            sciteBadge.setAttribute("data-layout", "horizontal");
                            sciteBadge.setAttribute("data-show-zero", "true");
                            sciteBadge.setAttribute("data-show-labels", "false");
                            page.parentElement.querySelector(".zotero-roam-page-div").appendChild(sciteBadge);
                        }
                    }
                }
            });
            // Manual trigger to insert badges
            window.__SCITE.insertBadges();
        }
    }
})();

;(()=>{
    zoteroRoam.formatting = {

        getCreators(item){
            return item.data.creators.map(creator => {
                let nameTag = (creator.name) ? `[[${creator.name}]]` : `[[${[creator.firstName, creator.lastName].filter(Boolean).join(" ")}]]`;
                if (creator.creatorType != "author") {
                    nameTag = nameTag + " (" + creator.creatorType + ")"
                }
                return nameTag;
            }).join(", ");
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
        getItemChildren(item, { pdf_as = "links", notes_as = "formatted", split_char = "\n" } = {}){
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
                case "links":
                    childrenObject.pdfItems = zoteroRoam.utils.makePDFLinks(itemChildren.filter(c => c.data.contentType == "application/pdf"));
                    break;
            };

            switch(notes_as){
                case "raw":
                    let notesResults = itemChildren.filter(c => c.data.itemType == "note");
                    childrenObject.notes = (notesResults.length == 0) ? false : notesResults;
                    break;
                case "formatted":
                    childrenObject.notes = zoteroRoam.utils.formatItemNotes(itemChildren.filter(c => c.data.itemType == "note"), {split_char: split_char});
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

        getItemType(item){
            let mapping = zoteroRoam.typemap[item.data.itemType] || item.data.itemType;
            if(zoteroRoam.config.userSettings.typemap){
                mapping = zoteroRoam.config.userSettings.typemap[item.data.itemType] || mapping;
            }
            return mapping;
        },

        getLocalLink(item, {text = "Local library"} = {}){
            return `[${text}](zotero://select/library/items/${item.data.key})`
        },

        getWebLink(item, {text = "Web library"} = {}){
            let webURI = (item.library.type = "user") ? "users" : "groups";
            return `[${text}](https://www.zotero.org/${webURI}/${item.library.id}/items/${item.data.key})`;
        },

        getTags(item){
            return item.data.tags.map(i => '#[[' + i.tag + ']]').join(", ");
        },

        getItemMetadata(item) {
            let metadata = [];
    
            if (item.data.title) { metadata.push(`Title:: ${item.data.title}`) }; // Title, if available
            if (item.data.creators.length > 0) { metadata.push(`Author(s):: ${zoteroRoam.formatting.getCreators(item)}`) }; // Creators list, if available
            if (item.data.abstractNote) { metadata.push(`Abstract:: ${item.data.abstractNote}`) }; // Abstract, if available
            if (item.data.itemType) { metadata.push(`Type:: [[${zoteroRoam.formatting.getItemType(item)}]]`) }; // Item type, from typemap or zoteroRoam.typemap (fall back on the raw value)
            metadata.push(`Publication:: ${ item.data.publicationTitle || item.data.bookTitle || "" }`)
            if (item.data.url) { metadata.push(`URL : ${item.data.url}`) };
            if (item.data.dateAdded) { metadata.push(`Date Added:: ${zoteroRoam.utils.makeDNP(item.data.dateAdded, {brackets: true})}`) }; // Date added, as Daily Notes Page reference
            metadata.push(`Zotero links:: ${zoteroRoam.formatting.getLocalLink(item)}, ${zoteroRoam.formatting.getWebLink(item)}`); // Local + Web links to the item
            if (item.data.tags.length > 0) { metadata.push(`Tags:: ${zoteroRoam.formatting.getTags(item)}`) }; // Tags, if any
            
            let children = zoteroRoam.formatting.getItemChildren(item, {pdf_as: "links", notes_as: "formatted", split_char: "\n"});
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
                    if (zoteroRoam.interface.search.visible){
                        zoteroRoam.interface.toggleSearchOverlay("hide");
                    }
                }
            },
            toggleSearchPanel: {
                defaultShortcut: {altKey: true, 'q': true},
                execute(){
                    let cmd = zoteroRoam.interface.search.visible ? "hide" : "show";
                    zoteroRoam.interface.toggleSearchOverlay(cmd);
                }
            },
            toggleQuickCopy: {
                defaultShortcut: [],
                execute(){
                    document.getElementById("zotero-quick-copy-mode").click();
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
                    if(zoteroRoam.interface.search.visible){
                        zoteroRoam.interface.search.input.focus();
                    }
                }
            },
            goToItemPage: {
                defaultShortcut: [],
                execute(){
                    let goToPageButton = document.querySelector("button.item-go-to-page");
                    let pageURL = `https://roamresearch.com/${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${goToPageButton.dataset.uid}`;
                    if(goToPageButton !== null && goToPageButton.disabled == false){
                        window.location.href = pageURL;
                        zoteroRoam.interface.toggleSearchOverlay("hide");
                    }
                }
            },
            copyCitekey: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey .copy-buttons a.bp3-button[format="citekey"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            copyCitation: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey .copy-buttons a.bp3-button[format="citation"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            copyTag: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey .copy-buttons a.bp3-button[format="tag"]');
                    if(copyButton !== null){
                        copyButton.click();
                    }
                }
            },
            copyPageRef: {
                defaultShortcut: [],
                execute(){
                    let copyButton = document.querySelector('.item-citekey .copy-buttons a.bp3-button[format="page-reference"]');
                    if(copyButton !== null){
                        copyButton.click();
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
            let toggleSeqText = (zoteroRoam.shortcuts.sequences["toggleSearchPanel"]) ? zoteroRoam.shortcuts.makeSequenceText("toggleSearchPanel", pre = "Toggle search panel with ") : "";
            let closeSeqText = (zoteroRoam.shortcuts.sequences["closeSearchPanel"]) ? zoteroRoam.shortcuts.makeSequenceText("closeSearchPanel", pre = "Exit with ") : "";
            if(toggleSeqText.length > 0 | closeSeqText.length > 0){
                let spanSeqs = document.createElement('span');
                spanSeqs.style = `font-style:italic;`;
                spanSeqs.innerHTML = `${[toggleSeqText, closeSeqText].filter(Boolean).join(" / ")}  `;
                let searchHeader = document.querySelector('.zotero-search-overlay .bp3-dialog-header');
                searchHeader.insertBefore(spanSeqs, zoteroRoam.interface.search.closeButton);
            };
            // Quick Copy : toggle
            let qcText = (zoteroRoam.shortcuts.sequences["toggleQuickCopy"]) ? zoteroRoam.shortcuts.makeSequenceText("toggleQuickCopy", pre = " ") : "";
            if(qcText.length > 0){
                let searchHeader = document.querySelector('.zotero-search-overlay .bp3-dialog-header');
                searchHeader.querySelector(".bp3-control.bp3-switch").innerHTML += qcText;
            };
            // Import metadata => in rendering of selected item
            // Focus searchbar
            let focusSearchBarText = (zoteroRoam.shortcuts.sequences["focusSearchBar"]) ? zoteroRoam.shortcuts.makeSequenceText("focusSearchBar") : "";
            if(focusSearchBarText.length > 0){
                let spanSeq = document.createElement('span');
                spanSeq.classList.add("bp3-input-action");
                spanSeq.style = `height:30px;padding:5px;`;
                spanSeq.innerHTML = `${focusSearchBarText}`;
                zoteroRoam.interface.search.input.closest('.bp3-input-group').appendChild(spanSeq);
            }
            // Go to item page => in rendering of selected item
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

export {zoteroRoam};