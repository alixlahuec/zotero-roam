import { categorizeLibraryItems, getLocalLink, getWebLink, parseDOI } from "../../utils";

/** Converts library data into a simplified list of top-level items, with their metadata, children, and links
 * @param {Object[]} arr - The library's contents, including top-level items, attachments and notes 
 * @param {Map} roamCitekeys - The map of citekey pages present in Roam 
 * @returns {Object[]} The simplified items
 * @see cleanLibraryReturnArrayType
 */
function cleanLibrary(arr, roamCitekeys){
	let lib = categorizeLibraryItems(arr);

	return lib.items
		.map(item => {
			let hasURL = item.data.url;
			let hasDOI = parseDOI(item.data.DOI);
			let weblink = hasURL
				? { href: hasURL, title: hasURL }
				: hasDOI
					? { href: "https://doi/org/" + hasDOI, title: hasDOI}
					: false;
			
			let creators = item.data.creators.map(cre => {
				return {
					full: cre.name || [cre.firstName, cre.lastName].filter(Boolean).join(" ") || "",
					last: cre.lastName || cre.name || "",
					role: cre.creatorType || ""
				};
			});
			let tags = Array.from(new Set(item.data.tags.map(t => t.tag)));
			let location = item.library.type + "s/" + item.library.id;

			let pdfs = lib.pdfs.filter(p => p.library.type + "s/" + p.library.id == location && p.data.parentItem == item.data.key);
			let notes = lib.notes.filter(n => n.library.type + "s/" + n.library.id == location && n.data.parentItem == item.data.key);

			return {
				abstract: item.data.abstractNote || "",
				authors: item.meta.creatorSummary || "",
				authorsFull: creators.map(cre => cre.full),
				authorsLastNames: creators.map(cre => cre.last),
				authorsRoles: creators.map(cre => cre.role),
				authorsString: creators.map(cre => cre.full).join(" "),
				children: {
					pdfs,
					notes
				},
				inGraph: roamCitekeys.has("@" + item.key) ? roamCitekeys.get("@" + item.key) : false,
				itemKey: item.data.key,
				itemType: item.data.itemType,
				key: item.key,
				location,
				publication: item.data.publicationTitle || item.data.bookTitle || item.data.university || "",
				tags: tags,
				tagsString: tags.map(tag => `#${tag}`).join(", "),
				title: item.data.title,
				weblink,
				year: item.meta.parsedDate ? new Date(item.meta.parsedDate).getUTCFullYear().toString() : "",
				zotero: {
					local: getLocalLink(item, {format: "target"}),
					web: getWebLink(item, {format: "target"})
				},
				"_multiField": "",
				raw: item
			};
		});
}

/** Converts a simplified item into a given string format for clipboard copy
 * @param {Object} simplifiedItem - An item as returned by {@link cleanLibrary} 
 * @param {Function|("citation"|"citekey"|"page-reference"|"raw"|"tag")} format - The formatter to be used. Can be either a preset or a custom function that accepts the item's citekey as its sole argument.
 * @returns {String} The formatted reference to the item
 */
function formatItemReferenceForCopy(simplifiedItem, format){
	let citekey = simplifiedItem.key;
	let pageRef = "[[@" + citekey + "]]";

	switch(true){
	case (format instanceof Function):
		return format(citekey, simplifiedItem.raw);
	case "page-reference":
		return pageRef;
	case "raw":
		return citekey;
	case "tag":
		return "#" + pageRef;
	case "citation":
		return "[" + simplifiedItem.authors + " (" + simplifiedItem.year + ")](" + pageRef + ")";
	case "citekey":
	default:
		return "@" + citekey;
	}
}

export {
	cleanLibrary,
	formatItemReferenceForCopy
};
