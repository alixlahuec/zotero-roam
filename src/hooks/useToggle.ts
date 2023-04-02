import { useCallback, useState } from "react";


type UseToggleArgs<T> = { start: T | null, options?: [T | null, T | null] };

/**
 * Custom hook for working with component state that toggles between two non-Boolean values
 */
const useToggle = <T = any>({ start, options = [start, null] }: UseToggleArgs<T>) => {
	const [state, setState] = useState(start);

	const toggle = useCallback(() => {
		setState(prevState => options.filter(op => op != prevState)[0]);
	}, [options]);

	return [state, toggle] as const;
};

export { useToggle };