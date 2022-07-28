import { expect } from "@storybook/jest";
import React, { useRef } from "react";
import { HotkeysProvider } from "@blueprintjs/core";
import SearchInputGroup from "./SearchInputGroup";
import useBool from "../../hooks/useBool";
import { userEvent, waitFor, within } from "@storybook/testing-library";

export default {
	component: SearchInputGroup,
	args: {
		userSettings: {
			copy: {
				useQuickCopy: false,
			},
			shortcuts: {
				focusSearchBar: "alt+F",
				toggleQuickCopy: "alt+Q"
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
	const [qcActive, { toggle: toggleQC }] = useBool(false);

	return <HotkeysProvider dialogProps={{globalGroupName: "zoteroRoam"}}>
		<SearchInputGroup {...args} quickCopyProps={{ isActive: qcActive, toggle: toggleQC }} searchbar={searchbar} />
	</HotkeysProvider>;
};

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async ({ args, canvasElement }) => {
	const { userSettings: { copy }} = args;
	const canvas = within(canvasElement);

	// Hotkey for toggling QuickCopy
	const qcSwitch = canvas.getByRole("switch");

	await expect(qcSwitch.checked)
		.toBe(copy.useQuickCopy);

	await userEvent.keyboard("{Alt>}Q{/Alt}");

	await waitFor(() => expect(qcSwitch.checked)
		.toBe(!copy.useQuickCopy));
    
	// Hotkey for focusing the searchbar
	const searchbar = canvas.getByPlaceholderText("Search in abstract, title, authors (last names), year, tags, or citekey");

	await expect(searchbar).not.toHaveFocus();

	await userEvent.keyboard("{Alt>}F{/Alt}");

	await waitFor(() => expect(searchbar).toHaveFocus());
};