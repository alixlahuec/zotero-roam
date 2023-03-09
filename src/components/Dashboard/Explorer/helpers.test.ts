import { getPDFLink } from "../../../utils";
import { cleanLibraryPDF, identifyPDFConnections } from "./helpers";

import { items } from "Mocks/zotero/items";
import { sampleAnnot } from "Mocks/zotero/annotations";
import { samplePDF } from "Mocks/zotero/pdfs";


test("Identifies the connections of a PDF item", () => {
	const parentKey = samplePDF.data.parentItem;
	const parent = items.find(it => it.data.key == parentKey);

	expect(identifyPDFConnections(
		samplePDF.data.key,
		parentKey,
		samplePDF.library.type + "s/" + samplePDF.library.id,
		{
			items: items,
			notes: [sampleAnnot]
		}))
		.toEqual({
			parent,
			annotations: [sampleAnnot]
		});
});

test("Formats PDF metadata", () => {
	const parent = items.find(it => it.data.key == samplePDF.data.parentItem);

	expect(cleanLibraryPDF(samplePDF, parent, [sampleAnnot]))
		.toEqual({
			annotations: [sampleAnnot],
			key: samplePDF.data.key,
			link: getPDFLink(samplePDF, "href"),
			parent,
			title: samplePDF.data.title,
			raw: samplePDF
		});
});