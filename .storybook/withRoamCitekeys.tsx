import { useMemo, useState } from "react";
import { DecoratorFn } from "@storybook/react";
import { RoamCitekeys } from "Components/RoamCitekeysContext";


export const withRoamCitekeys: DecoratorFn = (Story, context) => {
	const { args, parameters } = context;
	const [citekeys,] = useState<Map<string,string>>(new Map(args.roamCitekeys || []));
    
	const contextValue = useMemo(() => [citekeys, () => {}] as const, [citekeys]);

	return (
		<RoamCitekeys.Provider value={contextValue}>
			<Story {... { args, parameters }} />
		</RoamCitekeys.Provider>
	);
};