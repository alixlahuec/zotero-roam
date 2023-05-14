import { useCallback, useState } from "react";


type UseToggleArgs<T> = { start: T, options: [T, T] };

/**
 * Custom hook for working with component state that toggles between two non-Boolean values
 */
const useToggle = <T = any>({ start, options }: UseToggleArgs<T>) => {
	const [state, setState] = useState<T>(start);

	const toggle = useCallback(() => {
		setState(prevState => options.filter(op => op != prevState)[0]);
	}, [options]);

	return [state, toggle] as const;
};

export { useToggle };