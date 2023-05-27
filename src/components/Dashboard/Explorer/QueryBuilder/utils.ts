/** Adds an element to the end of an array
 * @param arr - The targeted array
 * @param elem - The element to add
 * @returns 
 */
function addElemToArray<T,V>(arr: T[], elem: V): (T | V)[]{
	return [...arr, elem];
}

/** Removes an element from an array at a given index
 * @param arr - The targeted array
 * @param index - The index of the element to remove
 * @returns 
 */
function removeArrayElemAt<T>(arr: T[], index: number): T[]{
	return [...arr.slice(0, index), ...arr.slice(index + 1, arr.length)];
}

/** Adds a sibling to an element. If the element is an array, the sibling is appended to the array ; otherwise, an array containing both arguments is returned.
 * @param elem - The targeted element
 * @param sibling - The sibling to add
 * @returns 
 */
function returnSiblingArray<T,V>(elem: T | T[], sibling: V): (T | V)[]{
	if(Array.isArray(elem)){
		return addElemToArray(elem, sibling);
	} else {
		return [elem, sibling];
	}
}

/** Updates the value of an array element from its index
 * @param arr - The targeted array
 * @param index - The index of the element to update
 * @param value - The new value of the element
 * @returns 
 */
function updateArrayElemAt<T,V extends T>(arr: T[], index: number, value: V): T[]{
	return [...arr.slice(0, index), value, ...arr.slice(index + 1, arr.length)];
}

export {
	addElemToArray,
	removeArrayElemAt,
	returnSiblingArray,
	updateArrayElemAt
};