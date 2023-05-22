import { Decorator } from "@storybook/react";
import { ExtensionContext } from "Components/App";
import { ExtensionContextValue } from "Types/extension";


const defaultContext: ExtensionContextValue = {
	portalId: "storybook-root",
	version: "VERSION"
};

export const withExtensionContext: Decorator<{ extensionContext: ExtensionContextValue }> = (Story, context) => {
	const { args: { extensionContext = {} }/*, parameters */ } = context;
    
	return (
		<ExtensionContext.Provider value={{ ...defaultContext, ...extensionContext }}>
			<Story {...context} />
		</ExtensionContext.Provider>
	);
};