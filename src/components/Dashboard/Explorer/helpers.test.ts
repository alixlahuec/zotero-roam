import { getPDFLink } from "../../../utils";
import { cleanLibraryPDF } from "./helpers";

import { items } from "Mocks/zotero/items";
import { sampleAnnot } from "Mocks/zotero/annotations";
import { samplePDF } from "Mocks/zotero/pdfs";


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