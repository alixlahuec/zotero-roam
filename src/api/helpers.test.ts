import { compareAnnotationRawIndices, formatZoteroAnnotations } from "./helpers";
import { simplifyZoteroAnnotations } from "../utils";
import { sampleAnnot, sampleImageAnnot } from "Mocks";


const simplifiedAnnot = simplifyZoteroAnnotations([sampleAnnot])[0];


test("compareAnnotationRawIndices", () => {
	const indices = [
		"00003|00014|00009",
		"00005|00010|00007",
		"00002|00022|00007",
		"00002|00022|00030",
		"00002|00024|00010",
		"00003|00014|00007",
		"00005|00009|00009"
	];

	expect(indices.sort(compareAnnotationRawIndices))
		.toEqual([
			"00002|00022|00007",
			"00002|00022|00030",
			"00002|00024|00010",
			"00003|00014|00007",
			"00003|00014|00009",
			"00005|00009|00009",
			"00005|00010|00007"
		]);
});

describe("formatZoteroAnnotations", () => {
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
});