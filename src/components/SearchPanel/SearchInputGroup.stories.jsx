import React, { useRef } from "react";
import { HotkeysProvider } from "@blueprintjs/core";
import SearchInputGroup from "./SearchInputGroup";
import useBool from "../../hooks/useBool";

export default {
	component: SearchInputGroup,
	args: {
		userSettings: {
			shortcuts: {
				// Shortcuts are disabled for the story
			}
		},
		handleClose: () => {},
		handleKeyDown: () => {},
		handleKeyUp: () => {},
		handleQueryChange: () => {}
	}
};

const Template = (args) => {
	const searchbar = useRef();
	const [qcActive,, toggleQC] = useBool(false);

	return <HotkeysProvider dialogProps={{globalGroupName: "zoteroRoam"}}>
		<SearchInputGroup {...args} quickCopyProps={{ isActive: qcActive, toggle: toggleQC }} searchbar={searchbar} />
	</HotkeysProvider>;
};

export const Default = Template.bind({});