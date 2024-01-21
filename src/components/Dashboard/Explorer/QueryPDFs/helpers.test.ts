import { cleanLibraryPDF, identifyPDFConnections } from "./helpers";
import { getPDFLink } from "../../../../utils";
import { items, sampleAnnot, samplePDF } from "Mocks";


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
			tags: samplePDF.data.tags.map(t => t.tag),
			title: samplePDF.data.title,
			raw: samplePDF
		});
});