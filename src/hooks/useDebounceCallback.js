/* istanbul ignore file */
import { useCallback, useRef } from "react";


/** Custom hook for debouncing a callback
 * From https://github.com/palantir/blueprint/issues/3281#issuecomment-607172353
 * @param {Function} callback - The callback to debounce
 * @param {Integer} timeout - The delay to be used (ms)
 * @returns The callback and a method to cancel it
 */
function useDebounceCallback(callback, timeout) {
	const timeoutRef = useRef(undefined);

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