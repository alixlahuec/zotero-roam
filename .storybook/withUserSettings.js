import React from "react";
import { UserSettings } from "../src/components/App";

export const withUserSettings = (Story, context) => {
    const { args/*, parameters */} = context;

    if(args.userSettings){
        return (
            <UserSettings.Provider value={args.userSettings}>
                <Story {...context} />
            </UserSettings.Provider>
        );
    } else {
        return <Story {...context} />;
    }
};