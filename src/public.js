import { findRoamPage } from "./roam";
import { formatNotes, getLocalLink, getPDFLink, getWebLink, makeDNP } from "./utils";

/** Converts Zotero PDF items into a specific format
 * @param {ZoteroItem[]} pdfs - The Array of Zotero PDFs
 * @param {("links"|"identity")} as - The desired format
 * @returns The formatted Array
 */
function formatPDFs(pdfs, as = "links"){
	if(!pdfs){
		return [];
	} else {
		switch(as){
		case "identity":
			return pdfs.map(file => ({
				title: file.data.title, 
				key: file.key, 
				link: getPDFLink(file, as = "href")
			}));
		case "links":
		default:
			return pdfs.map(file => getPDFLink(file, as = "markdown"));
		}
	}
}

/** Retrieves an item's collections' names, from a given list of collections
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {ZoteroCollection[]} collectionList - The list of library collections to match data to
 * @param {{brackets: Boolean}} config - Additional configuration 
 * @returns {String[]} The Array containing the names of the item's collections, if any
 */
function _getItemCollections(item, collectionList, { brackets = true } = {}){
	if(item.data.collections.length > 0){
		let output = [];

		item.data.collections.forEach(cl => {
			let libCollection = collectionList.find(el => el.key == cl);
			if(libCollection){ output.push(libCollection.data.name); }
		});

		return (brackets == true ? output.map(cl => `[[${cl}]]`) : output);
	} else {
		return [];
	}
}

/** Retrieves the creators list of a Zotero item, and returns it into a specific format
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {{return_as: ("array"|"string"|"identity"), brackets: Boolean, use_type: Boolean}} config - Additional configuration
 * @returns {String|String[]|{name: String, type: String, inGraph: (String|false)}[]} The formatted creators list
 */
function getItemCreators(item, { return_as = "string", brackets = true, use_type = true } = {}){
	let creatorsInfoList = item.data.creators.map(creator => {
		let nameTag = creator.name || `${[creator.firstName, creator.lastName].filter(Boolean).join(" ")}`;
		return {
			name: nameTag,
			type: creator.creatorType,
			inGraph: findRoamPage(nameTag)
		};
	});
	switch(return_as){
	case "identity":
		return creatorsInfoList;
	case "array":
		return creatorsInfoList.map(c => c.name);
	case "string":
	default:
		return creatorsInfoList.map(creator => {
			let creatorTag = (brackets == true ? `[[${creator.name}]]` : creator.name);
			return (use_type == true ? creatorTag + (creator.type == "author" ? "" : ` (${creator.type})`) : creatorTag);
		});
	}
}


function _getItemMetadata(item, pdfs, notes, typemap, notesSettings) {
	let metadata = [];

	if (item.data.title) { metadata.push(`Title:: ${item.data.title}`); } // Title, if available
	if (item.data.creators.length > 0) { metadata.push(`Author(s):: ${getItemCreators(item, {return_as: "string", brackets: true, use_type: true})}`); } // Creators list, if available
	if (item.data.abstractNote) { metadata.push(`Abstract:: ${item.data.abstractNote}`); } // Abstract, if available
	if (item.data.itemType) { metadata.push(`Type:: ${_getItemType(item, typemap, { brackets: true })}`); } // Item type, according to typemap
	metadata.push(`Publication:: ${ item.data.publicationTitle || item.data.bookTitle || "" }`);
	if (item.data.url) { metadata.push(`URL : ${item.data.url}`); }
	if (item.data.dateAdded) { metadata.push(`Date Added:: ${makeDNP(item.data.dateAdded, {brackets: true})}`); } // Date added, as Daily Notes Page reference
	metadata.push(`Zotero links:: ${getLocalLink(item, {format: "markdown", text: "Local library"})}, ${getWebLink(item, {format: "markdown", text: "Web library"})}`); // Local + Web links to the item
	if (item.data.tags.length > 0) { metadata.push(`Tags:: ${getItemTags(item, { return_as: "string", brackets: true })}`); } // Tags, if any

	if(pdfs.length > 0){
		metadata.push(`PDF links : ${formatPDFs(pdfs, "links")}`);
	}
	if(notes.length > 0){
		metadata.push({
			string: "[[Notes]]",
			children: formatNotes(notes, notesSettings)
		});
	}

	return metadata; 
}

/** Retrieves the tags of a Zotero item, and returns them into a specific format
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {{return_as: ("array"|"string"), brackets: Boolean}} config - Additional configuration 
 * @returns {String|String[]} The formatted tags, if any
 */
function getItemTags(item, { return_as = "string", brackets = true } = {}){
	let tags = item.data.tags.map(t => t.tag);
	let tagList = (brackets == true ? tags.map(el => `#[[${el}]]`) : tags);

	switch(return_as){
	case "array":
		return tagList;
	case "string":
	default:
		return tagList.join(", ");
	}
}

/** Retrieves the in-library relations of a Zotero item, and returns them into a specific format
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {ZoteroItem[]} datastore - The list of library items to match data to
 * @param {{return_as: ("array"|"string"|"raw"), brackets: Boolean}} config - Additional configuration 
 * @returns {String|String[]|ZoteroItem[]} The formatted relations, if any
 */
function _getItemRelated(item, datastore, { return_as = "string", brackets = true } = {}){
	if(item.data.relations && item.data.relations["dc:relation"]){
		let relatedItems = item.data.relations["dc:relation"];
		if(relatedItems.constructor === String){ relatedItems = [relatedItems]; }
        
		let output = [];
		let relRegex = /(users|groups)\/([^/]+)\/items\/(.+)/g;
        
		relatedItems.forEach(itemURI => {
			let [ , , , itemKey] = Array.from(itemURI.matchAll(relRegex))[0];
			let libItem = datastore.find(it => it.data.key == itemKey);
			if(libItem){ output.push(libItem); }
		});
        
		switch(return_as){
		case "raw":
			return output;
		case "array":
			return (brackets == true ? output.map(el => `[[@${el.key}]]`) : output.map(el => el.key));
		case "string":
		default:
			return (brackets == true ? output.map(el => `[[@${el.key}]]`) : output.map(el => el.key)).join(", ");
		}
	} else {
		return [];
	}
}

/** Retrieves the type of a Zotero item, according to a given typemap
 * @param {ZoteroItem} item - The targeted Zotero item
 * @param {Object} typemap - The typemap to be used
 * @param {{brackets: Boolean}} config - Additional configuration
 * @returns {String} The clean type for the item
 */
function _getItemType(item, typemap, { brackets = true } = {}){
	let type = typemap[item.data.itemType] || item.data.itemType;
	return (brackets == true ? `[[${type}]]` : type);
}

export {
	formatPDFs,
	getItemCreators,
	getItemTags,
	_getItemCollections,
	_getItemMetadata,
	_getItemRelated,
	_getItemType
};
