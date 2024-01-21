import { ZItem, ZItemTop } from "Types/transforms";


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


export { _getItemRelated };