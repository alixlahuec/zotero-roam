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
	formatItemReferenceForCopy
};
