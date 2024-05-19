import { cleanBibliographyHTML, compareAnnotationRawIndices, formatZoteroAnnotations } from "./helpers";
import { simplifyZoteroAnnotations } from "../utils";
import { bibs, sampleAnnot, sampleImageAnnot } from "Mocks";


const simplifiedAnnot = simplifyZoteroAnnotations([sampleAnnot])[0];


describe("cleanBibliographyHTML", () => {
	// Necessary since jsdom does not support innerText
	// It shouldn't give discrepant results here
	// https://github.com/jsdom/jsdom/issues/1245#issuecomment-763535573
	beforeAll(() => {
		Object.defineProperty(HTMLElement.prototype, "innerText", {
			get() {
				return this.textContent;
			}
		});
	});

	it("should correctly format citations with one content div (like Chicago)", () => {
		expect(cleanBibliographyHTML(bibs.itemFromUserLibrary.bib))
			.toBe("Agarwal, Payal, Rick Wang, Christopher Meaney, Sakina Walji, Ali Damji, Navsheer Gill Toor, Gina Yip, et al. “Sociodemographic Differences in Patient Experience with Virtual Care during COVID-19.” medRxiv, July 22, 2021. https://www.medrxiv.org/content/10.1101/2021.07.19.21260373v1.");
	});

	it("should correctly format citations with multiple content divs (like Vancouver)", () => {
		const sample_bib_vancouver = "<div class=\"csl-bib-body\" style=\"line-height: 1.35; \">\n  <div class=\"csl-entry\" style=\"clear: left; \">\n    <div class=\"csl-left-margin\" style=\"float: left; padding-right: 0.5em; text-align: right; width: 1em;\">1. </div><div class=\"csl-right-inline\" style=\"margin: 0 .4em 0 1.5em;\">MacDonald K, Fainman-Adelman N, Anderson KK, Iyer SN. Pathways to mental health services for young people: a systematic review. Soc Psychiatry Psychiatr Epidemiol. 2018 Oct;53(10):1005&#x2013;38.</div>\n   </div>\n</div>";

		expect(cleanBibliographyHTML(sample_bib_vancouver))
			.toBe("1. MacDonald K, Fainman-Adelman N, Anderson KK, Iyer SN. Pathways to mental health services for young people: a systematic review. Soc Psychiatry Psychiatr Epidemiol. 2018 Oct;53(10):1005–38.");
	});
});

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