import { HotkeysProvider } from "@blueprintjs/core";
import { DecoratorFn } from "@storybook/react";


export const withHotkeysProvider: DecoratorFn = (Story, context) => {
	const { args, parameters } = context;
	return <HotkeysProvider dialogProps={{ globalGroupName: "zoteroRoam" }}>
		<Story {...{ args, parameters }} />
	</HotkeysProvider>;
};