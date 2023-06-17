import { addElemToArray } from "../../../../utils";


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

export {
	returnSiblingArray
};