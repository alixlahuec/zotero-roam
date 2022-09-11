/** Adds an element to the end of an array
 * @param {Array} arr - The targeted array
 * @param {*} elem - The element to add
 * @returns 
 */
function addElemToArray(arr, elem){
	return [...arr, elem];
}

/** Removes an element from an array at a given index
 * @param {Array} arr - The targeted array
 * @param {Integer} index - The index of the element to remove
 * @returns 
 */
function removeArrayElemAt(arr, index){
	return [...arr.slice(0, index), ...arr.slice(index + 1, arr.length)];
}

/** Adds a sibling to an element. If the element is an array, the sibling is appended to the array ; otherwise, an array containing both arguments is returned.
 * @param {*|Array} elem - The targeted element
 * @param {*} sibling - The sibling to add
 * @returns 
 */
function returnSiblingArray(elem, sibling){
	if(elem.constructor === Array){
		return addElemToArray(elem, sibling);
	} else {
		return [elem, sibling];
	}
}

/** Updates the value of an array element from its index
 * @param {Array} arr - The targeted array
 * @param {Integer} index - The index of the element to update
 * @param {*} value - The new value of the element
 * @returns 
 */
function updateArrayElemAt(arr, index, value){
	return [...arr.slice(0, index), value, ...arr.slice(index + 1, arr.length)];
}

export {
	addElemToArray,
	removeArrayElemAt,
	returnSiblingArray,
	updateArrayElemAt
};