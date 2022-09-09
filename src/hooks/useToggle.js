import { useCallback, useState } from "react";


/** Custom hook for working with component state that toggles between two non-Boolean values
 * @param {{start: any, options: any[]}} config 
 * @returns {[any, function]}
 */
const useToggle = ({ start, options = [start, null] }) => {
	const [state, setState] = useState(start);

	const toggle = useCallback(() => {
		setState(prevState => options.filter(op => op != prevState)[0]);
	}, [options]);

	return [state, toggle];
};

export default useToggle;