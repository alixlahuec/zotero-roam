import { useCallback, useState } from "react";

/** Custom hook to work with component state that is based on a text input
 * @param {string} initialState - The initial value for the text input
 * @returns {[string, function]}
 */
const useText = (initialState = "") => {
	const [state, setState] = useState(initialState);

	const set = useCallback((event) => {
		setState(event.target.value);
	}, []);

	return [state, set];
};

export default useText;