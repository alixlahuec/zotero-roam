import { useCallback, useState } from "react";

const defaultTransform = (value) => value;

/** Custom hook for working with component state that works with a target select
 * @param {{start: any, transform: function}} config 
 * @returns {[any, function]}
 */
const useSelect = ({ start = null, transform = defaultTransform }) => {
	const [state, setState] = useState(start);

	const set = useCallback((event) => {
		setState(transform(event.currentTarget.value));
	}, [transform]);

	return [state, set];
};

export default useSelect;