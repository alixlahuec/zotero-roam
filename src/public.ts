import { findRoamPage } from "Roam";
import { getPDFLink } from "./utils";
import { ZItem, ZItemAttachment, ZItemTop } from "Types/transforms";
import { ZoteroAPI } from "Types/externals";


type PDFFormatOption = "links" | "identity" | "string";
type PDFAsIdentity = { key: string, link: string, title: string };

/** Converts Zotero PDF items into a specific format */
function _formatPDFs(pdfs: ZItemAttachment[], as: "identity"): PDFAsIdentity[];
function _formatPDFs(pdfs: ZItemAttachment[], as: "links"): string[];
function _formatPDFs(pdfs: ZItemAttachment[], as: "string"): string;
function _formatPDFs(pdfs: ZItemAttachment[], as: PDFFormatOption): string | string[] | PDFAsIdentity[];
function _formatPDFs(pdfs: ZItemAttachment[], as: PDFFormatOption = "string") {
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


type CreatorFormatOption = "array" | "identity" | "string";
type CreatorAsIdentity = { inGraph: string | false, name: string, type: ZoteroAPI.CreatorType };
type CreatorOptions<T extends CreatorFormatOption = CreatorFormatOption> = { brackets: boolean | "existing", return_as: T, use_type: boolean };

/** Retrieves the creators list of a Zotero item, and returns it into a specific format */
function _getItemCreators(item: ZItemTop, { brackets, return_as, use_type }: CreatorOptions<"array">): string[];
function _getItemCreators(item: ZItemTop, { brackets, return_as, use_type }: CreatorOptions<"identity">): CreatorAsIdentity[];
function _getItemCreators(item: ZItemTop, { brackets, return_as, use_type }: CreatorOptions<"string">): string;
function _getItemCreators(item: ZItemTop, { brackets, return_as, use_type }: CreatorOptions): string | string[] | CreatorAsIdentity[];
function _getItemCreators(item: ZItemTop, { return_as = "string", brackets = true, use_type = true }: Partial<CreatorOptions> = {}) {
	const creatorsInfoList = item.data.creators.map(creator => {
		const nameTag = "name" in creator
			? creator.name
			: `${[creator.firstName, creator.lastName].filter(Boolean).join(" ")}`;
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


type TagFormatOption = "array" | "string";
type TagOptions<T extends TagFormatOption = TagFormatOption> = { brackets: boolean, return_as: T };

/** Retrieves the tags of a Zotero item, and returns them into a specific format */
function _getItemTags(item: ZItemTop, { brackets, return_as }: TagOptions<"array">): string[];
function _getItemTags(item: ZItemTop, { brackets, return_as }: TagOptions<"string">): string;
function _getItemTags(item: ZItemTop, { brackets, return_as }: TagOptions): string | string[];
function _getItemTags(item: ZItemTop, { return_as = "string", brackets = true }: Partial<TagOptions> = {}){
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


type RelatedFormatOption = "array" | "raw" | "string";
export type RelatedOptions<T extends RelatedFormatOption = RelatedFormatOption> = { brackets: boolean, return_as: T };

/** Retrieves the in-library relations of a Zotero item, and returns them into a specific format */
function _getItemRelated(item: ZItemTop, datastore: ZItem[], { brackets, return_as }: RelatedOptions<"array">): string[];
function _getItemRelated(item: ZItemTop, datastore: ZItem[], { brackets, return_as }: RelatedOptions<"raw">): ZItem[];
function _getItemRelated(item: ZItemTop, datastore: ZItem[], { brackets, return_as }: RelatedOptions<"string">): string;
function _getItemRelated(item: ZItemTop, datastore: ZItem[], { brackets, return_as }: RelatedOptions): string | string[] | ZItem[];
function _getItemRelated(item: ZItemTop, datastore: ZItem[], { return_as = "string", brackets = true }: Partial<RelatedOptions> = {}){
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
