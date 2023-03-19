import { useCallback, useState } from "react";


/** Custom hook for handling boolean state via a toggle
 */
const useToggle = <T>({ start, options = [start, null] }: { start: T | null, options?: [T | null,T | null]}) => {
	const [state, setState] = useState<T | null>(start);

	const toggle = useCallback(() => {
		setState(prevState => options.filter(op => op != prevState)[0]);
	}, [options]);

	return [state, toggle] as const;
};

export default useToggle;