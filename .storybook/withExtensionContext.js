import React from "react";
import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";
import { ExtensionContext } from "../src/components/App";
import { analyzeUserRequests } from "../src/utils";

const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary: { path: userPath }, groupLibrary: { path: groupPath} } = libraries;

const defaultReqs = [
    { dataURI: userPath + "/items", apikey: masterKey, name: "My user library" },
    { dataURI: groupPath + "/items", apikey: masterKey, name: "My group library" }
];

const defaultContext = {
    ...analyzeUserRequests(defaultReqs),
    portalId: "root",
    version: "0.7.0"
}

export const withExtensionContext = (Story, context) => {
    const { args: { extensionContext = {} }/*, parameters */} = context;
    
    return (
        <ExtensionContext.Provider value={{ ...defaultContext, ...extensionContext }}>
            <Story {...context} />
        </ExtensionContext.Provider>
    );
}