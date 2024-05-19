import { cleanNewlines, compareAnnotationIndices, executeFunctionByName, extractSortIndex, formatItemAnnotations, simplifyZoteroAnnotations } from "../utils";
import { SettingsAnnotations } from "Types/extension";
import { ZItem, ZItemAnnotation, ZItemTop } from "Types/transforms";


/** Parses the XHTML bibliography for a Zotero item into Roam formatting
 * @param bib - The item's XHTML bibliography
 * @returns The clean bibliography string
 */
function cleanBibliographyHTML(bib: string) {
	let bibString = bib;

	// Strip divs
	const richTags = ["div"];
	richTags.forEach(tag => {
		// eslint-disable-next-line no-useless-escape
		const tagRegex = new RegExp(`<\/?${tag}>|<${tag} .+?>`, "g"); // Covers both the simple case : <tag> or </tag>, and the case with modifiers : <tag :modifier>
		bibString = bibString.replaceAll(tagRegex, "");
	});

	bibString = cleanNewlines(bibString).trim();

	// Use a textarea element to decode HTML
	const formatter = document.createElement("textarea");
	formatter.innerHTML = bibString;
	let formattedBib = formatter.innerText;
	// Convert italics
	formattedBib = formattedBib.replaceAll(/<\/?i>/g, "__");
	// Convert links
	const linkRegex = /<a href="(.+)">(.+)<\/a>/g;
	formattedBib = formattedBib.replaceAll(linkRegex, "[$2]($1)");

	return formattedBib;
}


/** Orders the (raw) indices of two Zotero annotations */
function compareAnnotationRawIndices(a: string, b: string): number {
	return compareAnnotationIndices(
		extractSortIndex(a),
		extractSortIndex(b)
	);
}


/** Formats an array of Zotero annotations into Roam blocks, with optional configuration */
function formatZoteroAnnotations(
	annotations: ZItemAnnotation[],
	{ func = "", use = "default", __with = "raw", ...settings }: Partial<SettingsAnnotations> = {}
): any {
	if (use == "function" && func) {
		// If the user has provided a custom function, execute it with the desired input
		return executeFunctionByName(func, window, __with == "raw" ? annotations : simplifyZoteroAnnotations(annotations));
	} else {
		return formatItemAnnotations(annotations, { ...settings });
	}
}


export type RelatedOptions = { brackets: boolean, return_as: "array" | "raw" | "string" };

/** Retrieves the in-library relations of a Zotero item, and returns them into a specific format */
function _getItemRelated(
	item: ZItemTop,
	datastore: ZItem[],
	{ return_as = "string", brackets = true }: Partial<RelatedOptions> = {}
): string | string[] | ZItem[] {
	if (item.data.relations && item.data.relations["dc:relation"]) {
		let relatedItems = item.data.relations["dc:relation"];
		if (typeof (relatedItems) === "string") { relatedItems = [relatedItems]; }

		const output: ZItem[] = [];
		const relRegex = /(users|groups)\/([^/]+)\/items\/(.+)/g;

		relatedItems.forEach(itemURI => {
			const [, , , itemKey] = Array.from(itemURI.matchAll(relRegex))[0];
			const libItem = datastore.find(it => it.data.key == itemKey);
			if (libItem) { output.push(libItem); }
		});

		switch (return_as) {
		case "raw":
			return output;
		case "array":
			return (brackets == true ? output.map(el => `[[@${el.key}]]`) : output.map(el => el.key));
		case "string":
		default:
			return (brackets == true ? output.map(el => `[[@${el.key}]]`) : output.map(el => el.key)).join(", ");
		}
	} else {
		switch (return_as) {
		case "raw":
		case "array":
			return [];
		case "string":
		default:
			return "";
		}
	}
}


export {
	_getItemRelated,
	cleanBibliographyHTML,
	compareAnnotationRawIndices,
	formatZoteroAnnotations
};