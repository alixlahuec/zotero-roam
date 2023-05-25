import { HotkeysProvider } from "@blueprintjs/core";
import { Decorator } from "@storybook/react";


export const withHotkeysProvider: Decorator = (Story, context) => {
	const { args, parameters } = context;
	return <HotkeysProvider dialogProps={{ globalGroupName: "zoteroRoam" }}>
		<Story {...{ args, parameters }} />
	</HotkeysProvider>;
};