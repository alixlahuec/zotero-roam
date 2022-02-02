import { getLocalLink, getWebLink, makeDNP } from "../utils";
import { getItemCreators } from "./getItemCreators";
import { getItemTags } from "./getItemTags";

// TODO: Decide if typemap should still be customizable ; add support for *formatted* children (PDFs/notes)
export function getItemMetadata(item, pdfs, notes) {
	let metadata = [];

	if (item.data.title) { metadata.push(`Title:: ${item.data.title}`); } // Title, if available
	if (item.data.creators.length > 0) { metadata.push(`Author(s):: ${getItemCreators(item, {creators_as: "string", brackets: true, use_type: true})}`); } // Creators list, if available
	if (item.data.abstractNote) { metadata.push(`Abstract:: ${item.data.abstractNote}`); } // Abstract, if available
	if (item.data.itemType) { metadata.push(`Type:: [[${item.data.itemType}]]`); } // **MODIFIED**, typemap use TBD
	metadata.push(`Publication:: ${ item.data.publicationTitle || item.data.bookTitle || "" }`);
	if (item.data.url) { metadata.push(`URL : ${item.data.url}`); }
	if (item.data.dateAdded) { metadata.push(`Date Added:: ${makeDNP(item.data.dateAdded, {brackets: true})}`); } // Date added, as Daily Notes Page reference
	metadata.push(`Zotero links:: ${getLocalLink(item, {format: "markdown", text: "Local library"})}, ${getWebLink(item, {format: "markdown", text: "Local library"})}`); // Local + Web links to the item
	if (item.data.tags.length > 0) { metadata.push(`Tags:: ${getItemTags(item)}`); } // Tags, if any

	if(pdfs.length > 0){
		console.log(pdfs); // **TEMPORARY**, children are given as raw for now
	}
	if(notes.length > 0){
		console.log(notes);
	}

	return metadata; 
}
