import { useCallback, useState } from "react";


/**
 * Custom hook for using a numeric input
 */
const useNumeric = (initialState = 0) => {
	const [state, setState] = useState<number>(initialState);

	const set = useCallback((_valnum: number, valstring: string) => {
		setState(Number(valstring));
	}, []);

	return [state, set] as const;
};

export { useNumeric };