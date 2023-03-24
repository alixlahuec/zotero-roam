import { useCallback, useState } from "react";


type IdentifyFn<T, V> = (item: T, val: V) => boolean;
type RetrieveFn<T, V> = (val: V) => T;

type UseMultiArgs<T, V> = Partial<{ start: T[], identify: IdentifyFn<T, V>, retrieve: RetrieveFn<T, V> }>;

const defaultIdentify: IdentifyFn<any, any> = (item, value) => item === value;
const defaultRetrieve: RetrieveFn<any, any> = (value) => value;

const addTo = <T,V>(state: T[], value: V, identify: IdentifyFn<T,V>, retrieve: RetrieveFn<T,V>) => {
	if(state.find(item => identify(item, value))){
		return state;
	} else {
		return [...state, retrieve(value)];
	}
};

const removeFrom = <T,V>(state: T[], value: V, identify: IdentifyFn<T,V>) => {
	return state.filter(item => !identify(item, value));
};

/** Custom hook to handle state via a multi-select
 */
const useMulti = <T, V>(
	{ start = [], identify = defaultIdentify, retrieve = defaultRetrieve }: UseMultiArgs<T,V>
) => {
	const [state, setState] = useState<T[]>(start);

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

	const set = useCallback((value?: T[]) => {
		setState(value || []);
	}, []);

	return [state, { set, toggle, add, remove }] as const;
};

export { useMulti };