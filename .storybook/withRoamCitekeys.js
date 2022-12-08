import { useMemo, useState } from "react";
import { RoamCitekeys } from "Components/RoamCitekeysContext";


export const withRoamCitekeys = (Story, context) => {
	const { args, parameters } = context;
	const [citekeys,] = useState(new Map(args.roamCitekeys || []));
    
	const contextValue = useMemo(() => [citekeys, () => {}], [citekeys]);

	return (
		<RoamCitekeys.Provider value={contextValue}>
			<Story {... { args, parameters }} />
		</RoamCitekeys.Provider>
	);
};