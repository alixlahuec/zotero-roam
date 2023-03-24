import { useCallback, useState } from "react";


/** Custom hook for handling a numeric state
 */
const useNumeric = (initialState = 0): [number, (valNum: number, valString: string) => void] => {
	const [state, setState] = useState<number>(initialState);

	const set = useCallback((_valnum, valstring) => {
		setState(Number(valstring));
	}, []);

	return [state, set];
};

export { useNumeric };