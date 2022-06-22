import React, { useCallback, useMemo, useRef, useState } from "react";
import { HotkeysProvider } from "@blueprintjs/core";
import SearchInputGroup from "./SearchInputGroup";

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
	const [qcActive, setQCActive] = useState(false);
	const toggleQC = useCallback(() => setQCActive(prevState => !prevState), []);
	const quickCopyProps = useMemo(() => {
		return {
			isActive: qcActive,
			toggle: toggleQC
		};
	}, [qcActive, toggleQC]);
	return <HotkeysProvider dialogProps={{globalGroupName: "zoteroRoam"}}>
		<SearchInputGroup {...args} quickCopyProps={quickCopyProps} searchbar={searchbar} />
	</HotkeysProvider>;
};

export const Default = Template.bind({});