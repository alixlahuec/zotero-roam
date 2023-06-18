import { useMemo, useState } from "react";
import { Decorator } from "@storybook/react";

import { RoamCitekeys } from "Components/RoamCitekeysContext";
import { RCitekeyPages } from "Types/transforms";


export const withRoamCitekeys: Decorator = (Story, context) => {
	const { args, parameters } = context;
	const [citekeys] = useState<RCitekeyPages>(new Map(parameters.roamCitekeys || []));
    
	const contextValue = useMemo(() => [citekeys, () => {}] as const, [citekeys]);

	return (
		<RoamCitekeys.Provider value={contextValue}>
			<Story {... { args, parameters }} />
		</RoamCitekeys.Provider>
	);
};