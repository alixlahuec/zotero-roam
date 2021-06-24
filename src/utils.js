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

        getAllRefPages(){
            return roamAlphaAPI.q(`[:find [(pull ?e [:node/title :block/uid])...] :where[?e :node/title ?t][(clojure.string/starts-with? ?t "@")]]`);
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
