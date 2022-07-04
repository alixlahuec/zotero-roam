import { formatItemReferenceForCopy } from "./utils";
import { cleanLibraryItem } from "../../utils";
import { items } from "Mocks/zotero/items";

test("Item reference formatting", () => {
	const sample_item = items.find(it => it.key == "blochImplementingSocialInterventions2021");
	const simplifiedItem = cleanLibraryItem(sample_item, [], [], new Map([]));

	expect(formatItemReferenceForCopy(
		simplifiedItem,
		"page-reference"))
		.toBe("[[@blochImplementingSocialInterventions2021]]");

	expect(formatItemReferenceForCopy(
		simplifiedItem,
		"raw"))
		.toBe("blochImplementingSocialInterventions2021");

	expect(formatItemReferenceForCopy(
		simplifiedItem,
		"tag"))
		.toBe("#[[@blochImplementingSocialInterventions2021]]");

	expect(formatItemReferenceForCopy(
		simplifiedItem,
		"citation"))
		.toBe("[Bloch and Rozmovits (2021)]([[@blochImplementingSocialInterventions2021]])");
    
	expect(formatItemReferenceForCopy(
		simplifiedItem,
		"citekey"))
		.toBe("@blochImplementingSocialInterventions2021");
    
	expect(formatItemReferenceForCopy(
		simplifiedItem,
		(citekey, raw) => `[@${citekey}](${raw.data.url})`))
		.toBe(`[@blochImplementingSocialInterventions2021](${sample_item.data.url})`);
});