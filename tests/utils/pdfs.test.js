import { identifyPDFConnections } from "../../src/utils";
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