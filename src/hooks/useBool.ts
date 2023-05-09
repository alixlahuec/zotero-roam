import { useCallback, useState } from "react";


type Value = boolean | null;

/** 
 * Custom hook for handling component state that takes a boolean
*/
const useBool = (initialState: Value = false) => {
	const [state, setState] = useState<Value>(initialState);
	
	const toggle = useCallback(() => {
		setState(prevState => !prevState);
	}, []);
    
	const set = useCallback((value: Value) => {
		setState(value);
	}, []);

	const on = useCallback(() => setState(true), []);

	const off = useCallback(() => setState(false), []);

	return [state, { set, toggle, on, off }] as const;
};

export { useBool };