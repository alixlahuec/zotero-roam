import { node } from "prop-types";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { getCitekeyPages } from "Roam";
import { RCitekeyPages } from "Types/transforms";


// https://devtrium.com/posts/how-use-react-context-pro#memoize-values-in-your-context-with-usememo-and-usecallback

const RoamCitekeys = createContext<(readonly [RCitekeyPages, () => void]) | null>(null);

const RoamCitekeysProvider = ({ children }) => {
	const [roamCitekeys, setRoamCitekeys] = useState<RCitekeyPages>(() => getCitekeyPages());

	const update = useCallback(() => {
		setRoamCitekeys(() => getCitekeyPages());
	}, []);

	const contextValue = useMemo(() => [roamCitekeys, update] as const, [roamCitekeys, update]);

	return (
		<RoamCitekeys.Provider value={contextValue}>
			{children}
		</RoamCitekeys.Provider>
	);
};
RoamCitekeysProvider.propTypes = {
	children: node
};

const useRoamCitekeys = () => {
	const context = useContext(RoamCitekeys);

	return context;
};

export { 
	RoamCitekeys, // For Storybook only
	RoamCitekeysProvider,
	useRoamCitekeys
};
