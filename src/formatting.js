;(()=>{
    zoteroRoam.formatting = {

        getCreators(item, {brackets = true} = {}){
            return item.data.creators.map(creator => {
                let nameTag = (creator.name) ? `${creator.name}` : `${[creator.firstName, creator.lastName].filter(Boolean).join(" ")}`;
                if(brackets == true){
                    nameTag = `[[${nameTag}]]`;
                }
                if (creator.creatorType != "author") {
                    nameTag = `${nameTag} (${creator.creatorType})`;
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
