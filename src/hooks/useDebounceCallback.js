/* istanbul ignore file */
import { useCallback, useRef } from "react";

// Debouncing query : https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
export default function useDebounceCallback(callback, timeout) {
	let timeoutRef = useRef(undefined);

	const cancel = function() {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	};

	const debounceCallback = useCallback(
		value => {
			cancel();
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null;
				callback(value);
			}, timeout);
		},
		[callback, timeout]
	);

	return [debounceCallback, cancel];
}