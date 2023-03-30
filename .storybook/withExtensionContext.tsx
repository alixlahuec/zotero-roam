import { ExtensionContext } from "Components/App";


const defaultContext = {
	portalId: "root",
	version: "VERSION"
};

export const withExtensionContext = (Story, context) => {
	const { args: { extensionContext = {} }/*, parameters */ } = context;
    
	return (
		<ExtensionContext.Provider value={{ ...defaultContext, ...extensionContext }}>
			<Story {...context} />
		</ExtensionContext.Provider>
	);
};