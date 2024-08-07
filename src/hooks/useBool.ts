import { useCallback, useState } from "react";


/** 
 * Custom hook for handling component state that takes a boolean
*/
const useBool = (initialState: boolean) => {
	const [state, setState] = useState(initialState);
	
	const toggle = useCallback(() => {
		setState(prevState => !prevState);
	}, []);

	const set = useCallback((value: boolean) => {
		setState(value);
	}, []);

	const on = useCallback(() => setState(true), []);

	const off = useCallback(() => setState(false), []);

	return [state, { set, toggle, on, off }] as const;
};

export { useBool };