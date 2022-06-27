import { useCallback, useState } from "react";

const defaultIdentify = (item, value) => item === value;
const defaultRetrieve = (value) => value;

const addTo = (state, value, identify, retrieve) => {
	if(state.find(item => identify(item, value))){
		return state;
	} else {
		return [...state, retrieve(value)];
	}
};

const removeFrom = (state, value, identify) => {
	return state.filter(item => !identify(item, value));
};

/** Custom hook to work with component state that is based on a multiple selection
 * @param {{start: any[], identify: function, retrieve: function}} config 
 * @returns {[any[], function, function, function, function]}
 */
const useMulti = ({ start = [], identify = defaultIdentify, retrieve = defaultRetrieve }) => {
	const [state, setState] = useState(start);

	const add = useCallback((val) => {
		setState(prevState => addTo(prevState, val, identify, retrieve));
	}, [identify, retrieve]);

	const remove = useCallback((val) => {
		setState(prevState => removeFrom(prevState, val, identify));
	}, [identify]);

	const toggle = useCallback((val) => {
		setState(prevState => {
			if(prevState.find(item => identify(item, val))){
				removeFrom(prevState, val, identify);
			} else {
				addTo(prevState, val, identify, retrieve);
			}
		});
	}, [identify, retrieve]);

	const set = useCallback((value) => {
		setState(value || []);
	}, []);

	return [state, set, toggle, add, remove];
};

export default useMulti;