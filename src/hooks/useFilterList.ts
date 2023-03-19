import { useReducer } from "react";


type Filter = {
	active: boolean,
	label: string,
	value: string
};

/** Toggles the `active` property of a filter, based on its key.
 */
const reducer = (filterList: Filter[], key: string) => {
	return filterList.map(op => {
		return op.value == key
			? { ...op, active: !op.active }
			: op;
	});
};

/** Custom hook for handling a list of filters */
const useFilterList = (filterList: Filter[]) => useReducer(reducer, filterList);

export default useFilterList;