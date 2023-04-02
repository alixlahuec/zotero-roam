import { FormEventHandler, useCallback, useState } from "react";


const defaultTransform = <T>(value: T) => value;

type UseSelectArgs<T> = Partial<{
	start: T | null,
	transform: (arg: any) => T
}>;

/**
 * Custom hook for working with component state that works with a target select
 */
const useSelect = <T = any>({ start = null, transform = defaultTransform }: UseSelectArgs<T>) => {
	const [state, setState] = useState(start);

	const set = useCallback<FormEventHandler<HTMLInputElement>>((event) => {
		setState(transform(event.currentTarget.value));
	}, [transform]);

	return [state, set] as const;
};

export { useSelect };