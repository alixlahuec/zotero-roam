import { SettingsCopy } from "Types/extension";
import { ZCleanItemTop } from "Types/transforms";

/** Creates a reference to a simplified item with default format */
function formatItemReferenceWithDefault(simplifiedItem: ZCleanItemTop, copySettings: SettingsCopy): string {
	const { authors, key, title, year } = simplifiedItem;
	const { preset, template, useAsDefault } = copySettings;

	switch(useAsDefault){
	case "template": {
		let output = template;
        
		const specs = {
			authors,
			key,
			title,
			year
		};

		for(const prop in specs){
			output = output.replaceAll(`{{${prop}}}`, `${specs[prop]}`);
		}

		return output;
	}
	case "preset":
	default:
		return formatItemReferenceForCopy(simplifiedItem, preset);
	}
}

type ItemReferenceFormat =
	| "citation"
	| "citekey"
	| "page-reference"
	| "raw"
	| "tag";

/** Converts a simplified item into a given string format for clipboard copy */
function formatItemReferenceForCopy(simplifiedItem: ZCleanItemTop, format: ItemReferenceFormat): string{
	const citekey = simplifiedItem.key;
	const pageRef = "[[@" + citekey + "]]";

	switch(true){
	case (format == "page-reference"):
		return pageRef;
	case (format == "raw"):
		return citekey;
	case (format == "tag"):
		return "#" + pageRef;
	case (format == "citation"):
		return "[" + simplifiedItem.authors + " (" + simplifiedItem.year + ")](" + pageRef + ")";
	case (format == "citekey"):
	default:
		return "@" + citekey;
	}
}

export {
	formatItemReferenceWithDefault
};

