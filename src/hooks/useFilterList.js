import { useReducer } from "react";


/** A filter option
 * @typedef {object} Filter
 * @property {Boolean} active
 * @property {String} label
 * @property {String} value
 */

/** Toggles the `active` property of a filter, based on its key.
 * @param {Filter[]} filterList 
 * @param {String} key 
 * @returns 
 */
const reducer = (filterList, key) => {
	return filterList.map(op => {
		return op.value == key
			? { ...op, active: !op.active }
			: op;
	});
};

const useFilterList = (filterList) => useReducer(reducer, filterList);

export { useFilterList };