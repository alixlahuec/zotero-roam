/* istanbul ignore file */
import { useCallback, useRef } from "react";


/** Custom hook for debouncing a callback
 * From https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
 * @returns The callback and a method to cancel it
 */
function useDebounceCallback(callback: CallableFunction, timeout: number) {
	const timeoutRef = useRef<NodeJS.Timeout | undefined | null>(undefined);

	const cancel = function() {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	};

	const debounceCallback = useCallback((value) => {
		cancel();
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			callback(value);
		}, timeout);
	}, [callback, timeout]);

	return [debounceCallback, cancel];
}

export { useDebounceCallback };