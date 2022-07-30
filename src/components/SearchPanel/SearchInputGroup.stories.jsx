import React, { useRef } from "react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { HotkeysProvider } from "@blueprintjs/core";
import { expect } from "@storybook/jest";

import SearchInputGroup from "./SearchInputGroup";
import useBool from "../../hooks/useBool";

export default {
	component: SearchInputGroup,
	args: {
		handleClose: () => {},
		handleKeyDown: () => {},
		handleKeyUp: () => {},
		handleQueryChange: () => {}
	},
	parameters: {
		userSettings: {
			copy: {
				useQuickCopy: false,
			},
			shortcuts: {
				focusSearchBar: "alt+F",
				toggleQuickCopy: "alt+Q"
			}
		}
	}
};

const Template = (args) => {
	const searchbar = useRef();
	const [qcActive, { toggle: toggleQC }] = useBool(false);

	return <HotkeysProvider dialogProps={{ globalGroupName: "zoteroRoam" }}>
		<SearchInputGroup {...args} quickCopyProps={{ isActive: qcActive, toggle: toggleQC }} searchbar={searchbar} />
	</HotkeysProvider>;
};

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async ({ canvasElement, parameters }) => {
	const { userSettings: { copy } } = parameters;
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