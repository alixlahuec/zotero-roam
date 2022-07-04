import React from "react";
import { HotkeysProvider } from "@blueprintjs/core";

export const withHotkeysProvider = (Story, context) => {
    const { args, parameters } = context;
    return <HotkeysProvider dialogProps={{globalGroupName: "zoteroRoam"}}>
        <Story {...{ args, parameters }} />
    </HotkeysProvider>
}