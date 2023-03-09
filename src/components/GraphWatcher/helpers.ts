/** Checks if the contents of a NodeList have changed
 * @see https://stackoverflow.com/questions/51958759/how-can-i-test-the-equality-of-two-nodelists
 * @returns `true` if the NodeList has changed ; `false` otherwise
 */
function hasNodeListChanged(prev: NodeList, current: NodeList): boolean {
	const arrPrev = Array.from(prev);
	const arrCurrent = Array.from(current);
	return (arrPrev.length + arrCurrent.length) != 0 && (arrPrev.length !== arrCurrent.length || arrPrev.some((el, i) => el !== arrCurrent[i]));
}

/** Sorts an array of objects on a given string key, in A-Z order
 * @returns The sorted array
 */
function sortElems(arr: Record<string,any>[], sort: string) {
	return arr.sort((a, b) => (`${a[sort]}`.toLowerCase() < `${b[sort]}`.toLowerCase()) ? -1 : 1);
}

export {
	hasNodeListChanged,
	sortElems
};