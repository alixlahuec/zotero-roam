import React from "react";
import { UserSettingsProvider} from "../src/components/UserSettings";

import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";

import { analyzeUserRequests, setupInitialSettings } from "../src/setup";

const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary: { path: userPath }, groupLibrary: { path: groupPath} } = libraries;

const defaultReqs = [
    { dataURI: userPath + "/items", apikey: masterKey, name: "My user library" },
    { dataURI: groupPath + "/items", apikey: masterKey, name: "My group library" }
];

const initRequests = analyzeUserRequests(defaultReqs);
const initSettings = setupInitialSettings({});

const init = {
    ...initRequests,
    ...initSettings
};

export const withUserSettings = (Story, context) => {
    const { parameters: { userSettings = {} } } = context;

    return <UserSettingsProvider init={{ ...init, ...userSettings }}>
        <Story {...context} />
    </UserSettingsProvider>
};