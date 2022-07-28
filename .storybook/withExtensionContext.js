import React from "react";
import { ExtensionContext } from "../src/components/App";

import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";

import { analyzeUserRequests } from "../src/setup";

const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary: { path: userPath }, groupLibrary: { path: groupPath} } = libraries;

const defaultReqs = [
    { dataURI: userPath + "/items", apikey: masterKey, name: "My user library" },
    { dataURI: groupPath + "/items", apikey: masterKey, name: "My group library" }
];

const defaultContext = {
    ...analyzeUserRequests(defaultReqs),
    portalId: "root",
    version: "VERSION"
}

export const withExtensionContext = (Story, context) => {
    const { args: { extensionContext = {} }/*, parameters */} = context;
    
    return (
        <ExtensionContext.Provider value={{ ...defaultContext, ...extensionContext }}>
            <Story {...context} />
        </ExtensionContext.Provider>
    );
}