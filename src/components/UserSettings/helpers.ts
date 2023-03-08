/** Converts a string from camelCase to Title Case
 * @see https://stackoverflow.com/questions/7225407/convert-camelcasetext-to-title-case-text */
function camelToTitleCase(text: string): string {
	const result = text.replace(/([A-Z])/g, " $1");
	const finalResult = result.charAt(0).toUpperCase() + result.slice(1);

	return finalResult;
}

export {
	camelToTitleCase
};