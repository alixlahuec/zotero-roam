import { useReducer } from "react";


export type Filter = {
	active: boolean,
	label: string,
	value: string
};

/** Toggles the `active` property of a filter, based on its key. */
const reducer = (filterList: Filter[], key: string) => {
	return filterList.map(op => {
		return op.value == key
			? { ...op, active: !op.active }
			: op;
	});
};

const useFilterList = (filterList: Filter[]) => useReducer(reducer, filterList);

export { useFilterList };