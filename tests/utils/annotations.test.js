import { sampleAnnot, sampleImageAnnot } from "Mocks/zotero/annotations";
import { libraries } from "Mocks/zotero/libraries";

import {
	compareAnnotationIndices,
	formatZoteroAnnotations,
	simplifyZoteroAnnotations } from "../../src/utils";

const { userLibrary } = libraries;

const simplifiedAnnot = simplifyZoteroAnnotations([sampleAnnot])[0];

const offset = new Date().getTimezoneOffset();

test("Sorts annotation indices", () => {
	const indices = [
		[3,14,9],
		[5,10,7],
		[2,22,7],
		[2,22,30],
		[2,24,10],
		[3,14,7],
		[5,9,9]
	];
	expect(indices.sort(compareAnnotationIndices))
		.toEqual([
			[2,22,7],
			[2,22,30],
			[2,24,10],
			[3,14,7],
			[3,14,9],
			[5,9,9],
			[5,10,7]
		]);
});

test("Simplifies annotations", () => {
	const { data } = sampleAnnot;
	expect(simplifiedAnnot)
		.toEqual({
			color: data.annotationColor,
			comment: data.annotationComment,
			date_added: data.dateAdded,
			date_modified: data.dateModified,
			day_added: offset > 780 ? "March 17th, 2022" : offset < -660 ? "March 19th, 2022" : "March 18th, 2022",
			day_modified: offset > 120 ? "April 1st, 2022" : offset < -1320 ? "April 3rd, 2022" : "April 2nd, 2022",
			key: sampleAnnot.key,
			library: userLibrary.path,
			link_pdf: "zotero://open-pdf/library/items/" + data.parentItem,
			link_page: "zotero://open-pdf/library/items/" + data.parentItem + "?page=25",
			page_label: data.annotationPageLabel,
			parent_item: data.parentItem,
			position: {
				pageIndex: 24,
				rects: [
					[203.6,431.053,546.865,441.6],
					[203.6,419.056,536.829,429.603],
					[203.6,407.059,566.448,417.606],
					[203.6,395.062,564.521,405.609],
					[203.6,383.065,265.699,393.612]
				]
			},
			raw: sampleAnnot,
			sortIndex: [24,1317,350],
			tags: ["Important", "TODO"],
			tags_string: "#[[Important]], #[[TODO]]",
			text: data.annotationText,
			type: data.annotationType
		});
});

describe("Annotations formatting", () => {
	it("formats with defaults", () => {
		expect(formatZoteroAnnotations([sampleAnnot]))
			.toEqual([
				{
					string: `[[>]] ${simplifiedAnnot.text} ([p. ${simplifiedAnnot.page_label}](${simplifiedAnnot.link_page})) ${simplifiedAnnot.tags_string}`,
					text: `[[>]] ${simplifiedAnnot.text} ([p. ${simplifiedAnnot.page_label}](${simplifiedAnnot.link_page})) ${simplifiedAnnot.tags_string}`,
					children: [simplifiedAnnot.comment]
				}
			]);
		expect(formatZoteroAnnotations([sampleImageAnnot]))
			.toEqual([
				// Images return null, and are filtered out
			]);
	});
	
	it("groups by day added", () => {
		expect(formatZoteroAnnotations([sampleAnnot], { group_by: "day_added" }))
			.toEqual([
				{
					string: "[[March 18th, 2022]]",
					text: "[[March 18th, 2022]]",
					children: [
						{
							string: `[[>]] ${simplifiedAnnot.text} ([p. ${simplifiedAnnot.page_label}](${simplifiedAnnot.link_page})) ${simplifiedAnnot.tags_string}`,
							text: `[[>]] ${simplifiedAnnot.text} ([p. ${simplifiedAnnot.page_label}](${simplifiedAnnot.link_page})) ${simplifiedAnnot.tags_string}`,
							children: [simplifiedAnnot.comment]
						}
					]
				}
			]);
	});
	
	it("formats with no highlight prefix", () => {
		expect(formatZoteroAnnotations([sampleAnnot], { highlight_prefix: "" }))
			.toEqual([
				{
					string: `${simplifiedAnnot.text} ([p. ${simplifiedAnnot.page_label}](${simplifiedAnnot.link_page})) ${simplifiedAnnot.tags_string}`,
					text: `${simplifiedAnnot.text} ([p. ${simplifiedAnnot.page_label}](${simplifiedAnnot.link_page})) ${simplifiedAnnot.tags_string}`,
					children: [simplifiedAnnot.comment]
				}
			]);
	});
	
	it("formats with no highlight suffix", () => {
		expect(formatZoteroAnnotations([sampleAnnot], { highlight_suffix: "" }))
			.toEqual([
				{
					string: `[[>]] ${simplifiedAnnot.text}`,
					text: `[[>]] ${simplifiedAnnot.text}`,
					children: [simplifiedAnnot.comment]
				}
			]);
	});
});