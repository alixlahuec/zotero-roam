import { mock } from "vitest-mock-extended";
import { cleanLibraryItem } from "../../utils";
import { cleanLibrary, formatItemReferenceWithDefault } from "./helpers";
import { items, libraries } from "Mocks";
import { SettingsCopy } from "Types/extension";


const { userLibrary } = libraries;

describe("cleanLibrary", () => {
	it("Simplifies Zotero item metadata", () => {
		expect(cleanLibrary([items[0]], new Map()))
			.toEqual([{
				abstract: items[0].data.abstractNote,
				authors: "Bloch and Rozmovits",
				authorsFull: ["Gary Bloch", "Linda Rozmovits"],
				authorsLastNames: ["Bloch", "Rozmovits"],
				authorsRoles: ["author", "author"],
				children: {
					pdfs: [],
					notes: []
				},
				createdByUser: null,
				inGraph: false,
				itemKey: items[0].data.key,
				itemType: items[0].data.itemType,
				key: "blochImplementingSocialInterventions2021",
				location: userLibrary.path,
				meta: "Bloch and Rozmovits (2021)",
				publication: "CMAJ",
				tags: [],
				title: "Implementing social interventions in primary care",
				weblink: {
					href: "https://www.cmaj.ca/content/193/44/E1696",
					title: "https://www.cmaj.ca/content/193/44/E1696"
				},
				year: "2021",
				zotero: {
					local: "zotero://select/library/items/" + items[0].data.key,
					web: "https://www.zotero.org/" + userLibrary.name + "/items/" + items[0].data.key
				},
				raw: items[0],
				_multiField: items[0].data.abstractNote + " Gary Bloch Linda Rozmovits 2021 Implementing social interventions in primary care blochImplementingSocialInterventions2021"
			}]);
	});
});

describe("formatItemReferenceWithDefault", () => {
	const sample_item = items.find(it => it.key == "blochImplementingSocialInterventions2021")!;
	const simplifiedItem = cleanLibraryItem(sample_item, [], [], new Map([]));

	const cases = [
		["page-reference", "[[@blochImplementingSocialInterventions2021]]"],
		["raw", "blochImplementingSocialInterventions2021"],
		["tag", "#[[@blochImplementingSocialInterventions2021]]"],
		["citation", "[Bloch and Rozmovits (2021)]([[@blochImplementingSocialInterventions2021]])"],
		["citekey", "@blochImplementingSocialInterventions2021"]
	] as const;

	test.each(cases)(
		"%s",
		(preset, expectation) => {
			expect(formatItemReferenceWithDefault(
				simplifiedItem, 
				mock<SettingsCopy>({
					preset,
					template: "",
					useAsDefault: "preset"
				})
			)).toBe(expectation);
		}
	);

});

describe("Item reference formatting - with template", () => {
	const sample_item = items.find(it => it.key == "blochImplementingSocialInterventions2021")!;
	const simplifiedItem = cleanLibraryItem(sample_item, [], [], new Map([]));
	
	const cases = [
		["@{{key}}", "@blochImplementingSocialInterventions2021"],
		[
			"[{{title}}]([[@{{key}}]])", 
			"[Implementing social interventions in primary care]([[@blochImplementingSocialInterventions2021]])"
		],
		[
			"[{{authors}} ({{year}})]([[@{{key}}]])",
			"[Bloch and Rozmovits (2021)]([[@blochImplementingSocialInterventions2021]])"
		]
	];

	test.each(cases)(
		"%# - %s",
		(template, expectation) => {
			expect(formatItemReferenceWithDefault(
				simplifiedItem, 
				mock<SettingsCopy>({
					template,
					useAsDefault: "template"
				})
			)).toBe(expectation);
		}
	);
});
