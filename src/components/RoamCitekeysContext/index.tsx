import { FC, createContext, useCallback, useContext, useMemo, useState } from "react";

import { getCitekeyPages } from "@services/roam";

import { RCitekeyPages } from "Types/transforms";


// https://devtrium.com/posts/how-use-react-context-pro#memoize-values-in-your-context-with-usememo-and-usecallback

const RoamCitekeys = createContext<(readonly [RCitekeyPages, () => void]) | null>(null);

const RoamCitekeysProvider: FC = ({ children }) => {
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

const useRoamCitekeys = () => {
	const context = useContext(RoamCitekeys);

	if (!context) {
		throw new Error("No context provided");
	}

	return context;
};

export { 
	RoamCitekeys, // For Storybook only
	RoamCitekeysProvider,
	useRoamCitekeys
};
