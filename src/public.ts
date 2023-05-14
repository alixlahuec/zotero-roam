import { findRoamPage } from "Roam";
import { getPDFLink } from "./utils";
import { ZoteroAPI } from "Types/externals";
import { AsBoolean } from "Types/helpers";
import { ZItem, ZItemAttachment, ZItemTop } from "Types/transforms";


type PDFFormatOption = "links" | "identity" | "string";
type PDFAsIdentity = { key: string, link: string, title: string };

/** Converts Zotero PDF items into a specific format */
function _formatPDFs(pdfs: ZItemAttachment[], as: PDFFormatOption = "string"): string | string[] | PDFAsIdentity[] {
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


type CreatorAsIdentity = { inGraph: string | boolean, name: string, type: ZoteroAPI.CreatorType };
type CreatorOptions = { brackets: boolean | "existing", return_as: "array" | "identity" | "string", use_type: boolean };

/** Retrieves the creators list of a Zotero item, and returns it into a specific format */
function _getItemCreators(item: ZItemTop, { return_as = "string", brackets = true, use_type = true }: Partial<CreatorOptions> = {}): string | string[] | CreatorAsIdentity[] {
	const creatorsInfoList = item.data.creators.map(creator => {
		const nameTag = "name" in creator
			? creator.name
			: `${[creator.firstName, creator.lastName].filter(AsBoolean).join(" ")}`;
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


type TagOptions = { brackets: boolean, return_as: "array" | "string" };

/** Retrieves the tags of a Zotero item, and returns them into a specific format */
function _getItemTags(item: ZItemTop, { return_as = "string", brackets = true }: Partial<TagOptions> = {}): string | string[]{
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


export type RelatedOptions = { brackets: boolean, return_as: "array" | "raw" | "string" };

/** Retrieves the in-library relations of a Zotero item, and returns them into a specific format */
function _getItemRelated(
	item: ZItemTop,
	datastore: ZItem[],
	{ return_as = "string", brackets = true }: Partial<RelatedOptions> = {}
): string | string[] | ZItem[] {
	if(item.data.relations && item.data.relations["dc:relation"]){
		let relatedItems = item.data.relations["dc:relation"];
		if(typeof(relatedItems) === "string"){ relatedItems = [relatedItems]; }
        
		const output: ZItem[] = [];
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
