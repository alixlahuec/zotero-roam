import { getPDFLink } from "../../../utils";
import { ZoteroItemAnnotation, ZoteroItemAttachment, ZoteroItemTop } from "Types/externals/zotero";
import { ZCleanItemPDF } from "Types/zotero";


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

export {
	cleanLibraryPDF
};