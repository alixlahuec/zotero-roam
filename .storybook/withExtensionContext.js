import React from "react";
import { ExtensionContext } from "../src/components/App";

const defaultContext = {
    portalId: "root",
    version: EXTENSION_VERSION
}

export const withExtensionContext = (Story, context) => {
    const { args: { extensionContext = {} }/*, parameters */} = context;
    
    return (
        <ExtensionContext.Provider value={{ ...defaultContext, ...extensionContext }}>
            <Story {...context} />
        </ExtensionContext.Provider>
    );
}