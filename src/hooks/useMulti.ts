import { useCallback, useState } from "react";


type IdentifyFn<T = any, V = any> = (item: T, val: V) => boolean;
type RetrieveFn<T = any, V = any> = (val: V) => T;

const defaultIdentify: IdentifyFn = (item, value) => item === value;
const defaultRetrieve: RetrieveFn = (value) => value;

const addTo = <T = any, V = any>(state: T[], value: V, identify: IdentifyFn<T, V>, retrieve: RetrieveFn<T, V>) => {
	if(state.find(item => identify(item, value))){
		return state;
	} else {
		return [...state, retrieve(value)];
	}
};

const removeFrom = <T = any, V = any>(state: T[], value: V, identify: IdentifyFn<T, V>) => {
	return state.filter(item => !identify(item, value));
};

type UseMultiArgs<T,V> = Partial<{ start: T[], identify: IdentifyFn<T, V>, retrieve: RetrieveFn<T, V> }>;

/**
 * Custom hook to work with component state that is based on a multiple selection
 */
const useMulti = <T = any, V = T>({ start = [], identify = defaultIdentify, retrieve = defaultRetrieve }: UseMultiArgs<T,V>) => {
	const [state, setState] = useState(start);

	const add = useCallback((val: V) => {
		setState(prevState => addTo<T,V>(prevState, val, identify, retrieve));
	}, [identify, retrieve]);

	const remove = useCallback((val: V) => {
		setState(prevState => removeFrom<T,V>(prevState, val, identify));
	}, [identify]);

	const toggle = useCallback((val: V) => {
		setState(prevState => {
			if(prevState.find(item => identify(item, val))){
				return removeFrom<T,V>(prevState, val, identify);
			} else {
				return addTo<T,V>(prevState, val, identify, retrieve);
			}
		});
	}, [identify, retrieve]);

	const set = useCallback((value: T[]) => {
		setState(value);
	}, []);

	return [state, { set, toggle, add, remove }] as const;
};

export { useMulti };