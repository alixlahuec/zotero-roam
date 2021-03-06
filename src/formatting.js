(()=>{
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

        async getItemBib(item, style = "apa"){
            // If the user included bib in their request, no need to call the API
            let bibHTML = (item.bib) ? item.bib : (await zoteroRoam.handlers.requestItemBib(item, style));
            return zoteroRoam.utils.formatBib(bibHTML);
        },

        // For a given item, returns an object with two properties :
        // - pdfItems : an Array of Markdown-style links to the local copy of each PDF file attached to the item
        // - notes : an Array of Arrays, where each child Array corresponds to a single note attached to the item (with each element being the note's contents, as delimited by newline)
        // If either is non-existent/unavailable, it takes the value `false`
        async getItemChildren(item){
            let childrenObject = {pdfItems: false, notes: false};
            let itemChildren = [];

            if(item.meta.numChildren > 0){
                let childrenInDataset = zoteroRoam.data.items.filter(i => i.data.parentItem == item.data.key & i.library.id == item.library.id);
                if(childrenInDataset.length == 0){
                    let remoteChildren = await zoteroRoam.handlers.requestItemChildren(item);
                    itemChildren = remoteChildren || [];
                } else {
                    itemChildren = childrenInDataset;
                }
            }
            childrenObject.pdfItems = zoteroRoam.utils.makePDFLinks(itemChildren.filter(c => c.data.contentType == "application/pdf"));
            childrenObject.notes = zoteroRoam.utils.formatItemNotes(itemChildren.filter(c => c.data.itemType == "note"));
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

        getLocalLink(item, text = "Local library"){
            return `[${text}](zotero://select/library/items/${item.data.key})`
        },

        getWebLink(item, text = "Web library"){
            let webURI = (item.library.type = "user") ? "users" : "groups";
            return `[${text}](https://www.zotero.org/${webURI}/${item.library.id}/items/${item.data.key})`;
        },

        getTags(item){
            return item.data.tags.map(i => '#[[' + i.tag + ']]').join(", ");
        },

        getItemMetadata(item) {
            let metadata = [];
    
            if (item.data.title) { metadata.push(`Title:: ${item.data.title}`) }; // Title, if available
            if (item.data.creators.length > 0) { metadata.push(`Author(s):: ${getCreators(item)}`) }; // Creators list, if available
            if (item.data.abstractNote) { metadata.push(`Abstract:: ${item.data.abstractNote}`) }; // Abstract, if available
            if (item.data.itemType) { metadata.push(`Type:: [[${getItemType(item)}]]`) }; // Item type, from typemap or zoteroRoam.typemap (fall back on the raw value)
            metadata.push(`Publication:: ${ item.data.publicationTitle || item.data.bookTitle || "" }`)
            if (item.data.url) { metadata.push(`URL : ${item.data.url}`) };
            if (item.data.dateAdded) { metadata.push(`Date Added:: [[${makeDNP(item.data.dateAdded)}]]`) }; // Date added, as Daily Notes Page reference
            metadata.push(`Zotero links:: ${getLocalLink(item)}, ${getWebLink(item)}`); // Local + Web links to the item
            if (item.data.tags.length > 0) { metadata.push(`Tags:: ${getTags(item)}`) }; // Tags, if any
        
            return metadata; 
        },

    }
})
