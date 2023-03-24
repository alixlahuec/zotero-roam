import { FormEventHandler, useCallback, useState } from "react";


type UseSelectArgs<T> = Partial<{
	start: T | null,
	transform: (arg: any) => T
}>;

const defaultTransform = <T>(value: T) => value;

/** Custom hook for handling state via a target select
 */
const useSelect = <T>({ start = null, transform = defaultTransform }: UseSelectArgs<T>) => {
	const [state, setState] = useState(start);

	const set = useCallback<FormEventHandler<HTMLInputElement>>((event) => {
		setState(transform(event.currentTarget.value));
	}, [transform]);

	return [state, set] as const;
};

export { useSelect };