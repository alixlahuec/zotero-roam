import { getPDFLink } from "../../../utils";
import { ZoteroItemAnnotation, ZoteroItemAttachment, ZoteroItemTop } from "Types/externals/zotero";
import { ZCleanItemPDF, ZLibraryContents } from "Types/zotero";


/** Formats a Zotero PDF's metadata into a clean format, with parent & annotations data */
function cleanLibraryPDF(pdf: ZoteroItemAttachment, parent: (ZoteroItemTop|Record<string, never>) = {}, annotations: ZoteroItemAnnotation[] = []): ZCleanItemPDF {
	return {
		annotations,
		key: pdf.data.key,
		link: getPDFLink(pdf, "href"),
		parent,
		title: pdf.data.filename || pdf.data.title,
		raw: pdf
	};
}

/** Identifies the connections of a Zotero PDF within a given set of item and notes entries
 * @param {String} itemKey - The Zotero key of the PDF item
 * @param {String} parentKey - The Zotero key of the PDF's parent
 * @param {String} location - The library location of the PDF item
 * @param {{items: ZoteroItemTop[], notes: (ZoteroItemNote|ZoteroItemAnnotation)[]}} data - The items among which connections are to be identified 
 * @returns The item's connections
 */
function identifyPDFConnections(
	itemKey: string,
	parentKey: string,
	location: string,
	{ items = [], notes = [] }: Pick<ZLibraryContents, "items" | "notes">
): {parent?: ZoteroItemTop, annotations: ZoteroItemAnnotation[] } {
	const parentItem = items.find(it => it.data.key == parentKey && (it.library.type + "s/" + it.library.id == location));
	const annotationItems = notes.filter(n => n.data.itemType == "annotation" && n.data.parentItem == itemKey && n.library.type + "s/" + n.library.id == location) as ZoteroItemAnnotation[];

	return {
		parent: parentItem,
		annotations: annotationItems
	};
}

export {
	cleanLibraryPDF,
	identifyPDFConnections
};