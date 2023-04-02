import { ChangeEventHandler, useCallback, useState } from "react";


/**
 * Custom hook to work with component state that is based on a text input
 */
const useText = (initialState = "") => {
	const [state, setState] = useState<string>(initialState);

	const set = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
		setState(event.target.value);
	}, []);

	return [state, set] as const;
};

export { useText };