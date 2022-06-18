import React from "react";
import { data as keys } from "../mocks/zotero/keys";
import { data as libraries } from "../mocks/zotero/libraries";
import { ExtensionContext } from "../src/components/App";
import { analyzeUserRequests } from "../src/utils";

const { keyWithFullAccess: { masterKey } } = keys;
const { userLibrary: { path: userPath }, groupLibrary: { path: groupPath} } = libraries;

const defaultContext = {
    ...analyzeUserRequests([
        { dataURI: userPath + "/items", apikey: masterKey, name: "My user library" },
        { dataURI: groupPath + "/items", apikey: masterKey, name: "My group library" }
    ]),
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