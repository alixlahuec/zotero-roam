import { getPDFLink } from "../../../../utils";
import { isZAnnotation, ZCleanItemPDF, ZItemAnnotation, ZItemAttachment, ZItemTop, ZLibraryContents } from "Types/transforms";


/** Formats a Zotero PDF's metadata into a clean format, with parent & annotations data */
function cleanLibraryPDF(pdf: ZItemAttachment, parent: (ZItemTop | Record<string, never>) = {}, annotations: ZItemAnnotation[] = []): ZCleanItemPDF {
	return {
		annotations,
		key: pdf.data.key,
		link: getPDFLink(pdf, "href"),
		parent,
		title: pdf.data.filename || pdf.data.title,
		raw: pdf,
		tags: pdf.data.tags.map(t => t.tag)
	};
}

/** Identifies the connections of a Zotero PDF within a given set of item and notes entries
 * @param itemKey - The Zotero key of the PDF item
 * @param parentKey - The Zotero key of the PDF's parent
 * @param location - The library location of the PDF item
 * @param data - The items among which connections are to be identified 
 * @returns The item's connections
 */
function identifyPDFConnections(
	itemKey: string,
	parentKey: string,
	location: string,
	{ items = [], notes = [] }: Pick<ZLibraryContents, "items" | "notes">
): { parent?: ZItemTop, annotations: ZItemAnnotation[] } {
	const parentItem = items.find(it => it.data.key == parentKey && (it.library.type + "s/" + it.library.id == location));
	const annotationItems = notes.filter(isZAnnotation)
		.filter(n => n.data.parentItem == itemKey && n.library.type + "s/" + n.library.id == location);

	return {
		parent: parentItem,
		annotations: annotationItems
	};
}


export { cleanLibraryPDF, identifyPDFConnections };