import { mock } from "vitest-mock-extended";

import { cleanBibliographyHTML, compareAnnotationRawIndices, formatNotes, formatZoteroAnnotations, getItemDateAdded } from "./helpers";

import { setupInitialSettings } from "../setup";
import { formatItemAnnotations, formatItemNotes, simplifyZoteroAnnotations } from "../utils";

import { bibs, sampleAnnot, sampleAnnotPrevPage, sampleAnnotLaterPage, sampleImageAnnot, sampleNote, sampleOlderNote } from "Mocks";
import { existing_block_uid, existing_block_uid_with_children, uid_with_existing_block, uid_with_existing_block_with_children } from "Mocks/roam";
import { ZItem } from "Types/transforms";


const simplifiedAnnot = simplifyZoteroAnnotations([sampleAnnot])[0];
const { annotations, notes } = setupInitialSettings({});
const settings = { annotationsSettings: annotations, notesSettings: notes };


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

	it("formats citations with one content div (like Chicago)", () => {
		expect(cleanBibliographyHTML(bibs.itemFromUserLibrary.bib))
			.toBe("Agarwal, Payal, Rick Wang, Christopher Meaney, Sakina Walji, Ali Damji, Navsheer Gill Toor, Gina Yip, et al. “Sociodemographic Differences in Patient Experience with Virtual Care during COVID-19.” medRxiv, July 22, 2021. https://www.medrxiv.org/content/10.1101/2021.07.19.21260373v1.");
	});

	it("formats citations with multiple content divs (like Vancouver)", () => {
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

describe("formatNotes", () => {
	it("sorts output", () => {
		expect(formatNotes([sampleAnnotLaterPage, sampleAnnotPrevPage], null, settings))
			.toEqual([
				...formatItemAnnotations([sampleAnnotPrevPage]),
				...formatItemAnnotations([sampleAnnotLaterPage])
			]);

		expect(formatNotes([sampleNote, sampleOlderNote], null, settings))
			.toEqual([
				...formatItemNotes([sampleOlderNote]),
				...formatItemNotes([sampleNote])
			]);

		expect(formatNotes([sampleNote, sampleAnnotLaterPage, sampleAnnotPrevPage], null, settings))
			.toEqual([
				...formatItemAnnotations([sampleAnnotPrevPage]),
				...formatItemAnnotations([sampleAnnotLaterPage]),
				...formatItemNotes([sampleNote])
			]);
	});

	it("handles nested output (with preset)", () => {
		const notesSettings = {
			...settings.notesSettings,
			nest_preset: "[[Notes]]",
			nest_use: "preset"
		} as const

		expect(formatNotes([sampleNote, sampleOlderNote], null, { ...settings, notesSettings }))
			.toEqual([
				{
					string: notesSettings.nest_preset,
					text: notesSettings.nest_preset,
					children: [
						...formatItemNotes([sampleOlderNote]),
						...formatItemNotes([sampleNote])
					]
				}
			]);
	});

	it("handles nested output (with custom string)", () => {
		const custom_string = "[[My Notes]]";

		const notesSettings = {
			...settings.notesSettings,
			nest_char: custom_string,
			nest_use: "custom"
		} as const

		expect(formatNotes([sampleNote, sampleOlderNote], null, { ...settings, notesSettings }))
			.toEqual([
				{
					string: custom_string,
					text: custom_string,
					children: [
						...formatItemNotes([sampleOlderNote]),
						...formatItemNotes([sampleNote])
					]
				}
			]);
	});

	it("handles nested output, with block checking", () => {
		const custom_string = "[[My Notes]]";
		const mockSettings = {
			...settings,
			notesSettings: {
				...settings.notesSettings,
				nest_char: custom_string,
				nest_position: "top",
				nest_preset: false,
				nest_use: "custom"
			}
		} as const

		const formattedOutput = formatItemNotes([sampleNote]);

		expect(formatNotes([sampleNote], uid_with_existing_block, mockSettings)).toEqual(
			formattedOutput.map(blck => ({
				string: blck,
				text: blck,
				order: 0,
				parentUID: existing_block_uid
			}))
		);

		expect(formatNotes([sampleNote], uid_with_existing_block_with_children, mockSettings)).toEqual(
			formattedOutput.map(blck => ({
				string: blck,
				text: blck,
				order: 0,
				parentUID: existing_block_uid_with_children
			}))
		);

		expect(formatNotes([sampleNote], "uid without existing block", mockSettings)).toEqual([
			{
				string: custom_string,
				text: custom_string,
				children: formattedOutput
			}
		]);

	});

	it("handles nested output, with block checking & position", () => {
		const mockSettings = {
			...settings,
			notesSettings: {
				...settings.notesSettings,
				nest_char: "[[My Notes]]",
				nest_position: "bottom",
				nest_preset: false,
				nest_use: "custom"
			}
		} as const

		const formattedOutput = formatItemNotes([sampleNote]);

		expect(formatNotes([sampleNote], uid_with_existing_block, mockSettings))
			.toEqual(
				formattedOutput.map(blck => ({
					string: blck,
					text: blck,
					order: 0,
					parentUID: existing_block_uid
				}))
			);

		expect(formatNotes([sampleNote], uid_with_existing_block_with_children, mockSettings))
			.toEqual(
				formattedOutput.map(blck => ({
					string: blck,
					text: blck,
					order: 2,
					parentUID: existing_block_uid_with_children
				}))
			);
	});
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

test("getItemDateAdded", () => {
	const date = new Date(2022, 0, 1).toString();
	const mockItem = mock<ZItem>({ data: { dateAdded: date } });

	expect(getItemDateAdded(mockItem)).toBe("[[January 1st, 2022]]");
	expect(getItemDateAdded(mockItem, { brackets: false })).toBe("January 1st, 2022");

});