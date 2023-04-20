import { mock } from "jest-mock-extended";
import { cleanLibraryItem } from "../../utils";
import { formatItemReferenceWithDefault } from "./utils";
import { items } from "Mocks";
import { SettingsCopy } from "Types/extension";


describe("Item reference formatting - with preset", () => {
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
