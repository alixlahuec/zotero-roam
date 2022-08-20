function formatItemReferenceWithDefault(simplifiedItem, copySettings){
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

/** Converts a simplified item into a given string format for clipboard copy
 * @param {Object} simplifiedItem - An item as returned by {@link cleanLibrary} 
 * @param {Function|("citation"|"citekey"|"page-reference"|"raw"|"tag")} format - The formatter to be used. Can be either a preset or a custom function that accepts the item's citekey as its sole argument.
 * @returns {String} The formatted reference to the item
 */
function formatItemReferenceForCopy(simplifiedItem, format){
	const citekey = simplifiedItem.key;
	const pageRef = "[[@" + citekey + "]]";

	switch(true){
	case (format instanceof Function):
		return format(citekey, simplifiedItem.raw);
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
