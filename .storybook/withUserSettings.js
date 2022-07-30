import React from "react";
import { UserSettings } from "../src/components/App";

export const withUserSettings = (Story, context) => {
    const { parameters: { userSettings = {} } } = context;

    if(userSettings){
        return (
            <UserSettings.Provider value={userSettings}>
                <Story {...context} />
            </UserSettings.Provider>
        );
    } else {
        return <Story {...context} />;
    }
};