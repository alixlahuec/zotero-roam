import { useCallback, useState } from "react";


type Handlers = {
	off: () => void,
	on: () => void,
	set: (value: boolean) => void,
	toggle: () => void
};

/** Custom hook for handling a boolean state
 */
const useBool = (initialState = false): [boolean, Handlers] => {
	const [state, setState] = useState<boolean>(initialState);
	
	const toggle = useCallback(() => {
		setState(prevState => !prevState);
	}, []);
    
	const set = useCallback((value) => {
		setState(value);
	}, []);

	const on = useCallback(() => setState(true), []);

	const off = useCallback(() => setState(false), []);

	return [state, { set, toggle, on, off }];
};

export { useBool };