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
            return roamAlphaAPI.q(`[:find [(pull ?e [:node/title])...] :where[?e :node/title ?t]]`);
        },

        getAllRefPages(){
            return roamAlphaAPI.q(`[:find [(pull ?e [:node/title :block/uid])...] :where[?e :node/title ?t][(clojure.string/starts-with? ?t "@")]]`);
        },

        getItemPrefix(item){
            return `${item.library.type}s/${item.library.id}`;
        },

        // RETIRED
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

        getLibraries(){
            return zoteroRoam.data.libraries.map(lib => {
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

        makeTimestamp(date){
            let d = date.constructor === Date ? date : new Date(date);
            return `${d.getHours()}:${('0' + d.getMinutes()).slice(-2)}`;
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
            let terms = Array.from(new Set(query.toLowerCase().split(" ")));
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
                    return formatCheck[0];
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
                doi: item.doi,
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
            <a class="bp3-button ${linkClass}" href="${target}" ${linkAttribute}>
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
        
            // If search is case-insensitive, and the query is not an acronym, transform query & target to lowercase
            if(any_case == true && !query.match(/[A-Z]{2}/g)){
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
                    let searchReg = new RegExp(searchString, 'g');
                    return target.match(searchReg) ? true : false;
                } else {
                    let searchReg = new RegExp('(?:\\W|^)' + searchString + '(?:\\W|$)', 'g');
                    return target.match(searchReg) ? true : false;
                }
            } else {
                // Multi-word query
                let searchArray = queryWords;
                if(search_compounds == true){
                    if(isHyphenated){
                        // For each hyphenated term, replace hyphen by inclusive match (hyphen, space, nothing)
                        searchArray = queryWords.map(w => {
                            if(w.includes("-")){
                                return w.replace('-', '(?: |-)?');
                            } else {
                                return w;
                            }
                        });
                    } else if(!isHyphenated && word_order == "strict"){
                        // If strict mode :
                        // Join the search Array by inclusive match pattern (hyphen, space, nothing)
                        searchArray = [queryWords.join('(?: |-)?')]; // keeping Array form so that the logic can be the same later on       
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
                    let searchReg = new RegExp('(?:\\W|^)' + searchArray.join(" ") + '(?:\\W|$)', 'g');
                    return target.match(searchReg) ? true : false;
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
