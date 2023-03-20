import { findRoamPage } from "Roam";
import { getPDFLink } from "./utils";

/** Converts Zotero PDF items into a specific format
 * @param {ZoteroAPI.ItemAttachment[]} pdfs - The Array of Zotero PDFs
 * @param {("links"|"identity"|"string")} as - The desired format
 * @returns The formatted Array
 */
function _formatPDFs(pdfs, as = "string"){
	if(!pdfs){
		switch(as){
		case "identity":
		case "links":
			return [];
		case "string":
		default:
			return "";
		}
	} else {
		const pdfsIdentity = pdfs.map(file => ({
			title: file.data.filename || file.data.title, 
			key: file.key, 
			link: getPDFLink(file, "href")
		}));
		switch(as){
		case "identity":
			return pdfsIdentity;
		case "links":
			return pdfsIdentity.map(entry => `[${entry.title}](${entry.link})`);
		case "string":
		default:
			return pdfsIdentity.map(entry => `[${entry.title}](${entry.link})`).join(", ");
		}
	}
}

/** Retrieves the creators list of a Zotero item, and returns it into a specific format
 * @param {ZoteroAPI.ItemTop} item - The targeted Zotero item
 * @param {{return_as?: ("array"|"string"|"identity"), brackets?: (true|false|"existing"), use_type?: Boolean}} config - Additional configuration
 * @returns {String|String[]|{name: String, type: String, inGraph: (String|false)}[]} The formatted creators list
 */
function _getItemCreators(item, { return_as = "string", brackets = true, use_type = true } = {}){
	const creatorsInfoList = item.data.creators.map(creator => {
		const nameTag = creator.name || `${[creator.firstName, creator.lastName].filter(Boolean).join(" ")}`;
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
			const creatorTag = (brackets == true || (brackets == "existing" && creator.inGraph))
				? `[[${creator.name}]]`
				: creator.name;
			return (use_type == true ? creatorTag + (creator.type == "author" ? "" : ` (${creator.type})`) : creatorTag);
		}).join(", ");
	}
}

/** Retrieves the tags of a Zotero item, and returns them into a specific format
 * @param {ZoteroAPI.ItemTop} item - The targeted Zotero item
 * @param {{return_as?: ("array"|"string"), brackets?: Boolean}} config - Additional configuration 
 * @returns {String|String[]} The formatted tags, if any
 */
function _getItemTags(item, { return_as = "string", brackets = true } = {}){
	const tags = item.data.tags.map(t => t.tag);
	const tagList = (brackets == true ? tags.map(el => `#[[${el}]]`) : tags);

	switch(return_as){
	case "array":
		return tagList;
	case "string":
	default:
		return tagList.join(" ");
	}
}

/** Retrieves the in-library relations of a Zotero item, and returns them into a specific format
 * @param {ZoteroAPI.ItemTop} item - The targeted Zotero item
 * @param {ZoteroAPI.Item[]} datastore - The list of library items to match data to
 * @param {{return_as?: ("array"|"string"|"raw"), brackets?: Boolean}} config - Additional configuration 
 * @returns {String|String[]|ZoteroAPI.ItemTop[]} The formatted relations, if any
 */
function _getItemRelated(item, datastore, { return_as = "string", brackets = true } = {}){
	if(item.data.relations && item.data.relations["dc:relation"]){
		let relatedItems = item.data.relations["dc:relation"];
		if(relatedItems.constructor === String){ relatedItems = [relatedItems]; }
        
		const output = [];
		const relRegex = /(users|groups)\/([^/]+)\/items\/(.+)/g;
        
		relatedItems.forEach(itemURI => {
			const [ , , , itemKey] = Array.from(itemURI.matchAll(relRegex))[0];
			const libItem = datastore.find(it => it.data.key == itemKey);
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
		switch(return_as){
		case "raw":
		case "array":
			return [];
		case "string":
		default:
			return "";
		}
	}
}

export {
	_formatPDFs,
	_getItemCreators,
	_getItemTags,
	_getItemRelated,
};
