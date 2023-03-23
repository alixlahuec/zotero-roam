import { useCallback, useState } from "react";


/** Custom hook for using a numeric input
 * @param {number} initialState - The initial value for the input
 * @returns {[number, function]}
 */
const useNumeric = (initialState = 0) => {
	const [state, setState] = useState(initialState);

	const set = useCallback((_valnum, valstring) => {
		setState(Number(valstring));
	}, []);

	return [state, set];
};

export { useNumeric };