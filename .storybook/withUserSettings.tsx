import { Decorator } from "@storybook/react";

import { UserSettingsProvider } from "Components/UserSettings";
import { analyzeUserRequests, setupInitialSettings } from "../src/setup";

import { apiKeys, libraries } from "Mocks";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary: { path: userPath }, groupLibrary: { path: groupPath } } = libraries;

const defaultReqs = [
	{ dataURI: userPath + "/items", apikey: masterKey, name: "My user library" },
	{ dataURI: groupPath + "/items", apikey: masterKey, name: "My group library" }
];

const initRequests = analyzeUserRequests(defaultReqs);
const initSettings = setupInitialSettings({});

const init = {
	requests: initRequests,
	...initSettings
};

export const withUserSettings: Decorator = (Story, context) => {
	const { parameters: { userSettings = {} } } = context;

	return <UserSettingsProvider init={{ ...init, ...userSettings }}>
		<Story {...context} />
	</UserSettingsProvider>;
};