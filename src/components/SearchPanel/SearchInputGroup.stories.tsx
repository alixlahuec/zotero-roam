import { ComponentProps, useRef } from "react";
import { HotkeysProvider } from "@blueprintjs/core";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";

import SearchInputGroup from "./SearchInputGroup";
import { useBool } from "../../hooks";


type Props = ComponentProps<typeof SearchInputGroup>;

export default {
	component: SearchInputGroup,
	args: {
		handleClose: () => {},
		handleKeyDown: () => {},
		handleKeyUp: () => {},
		handleQueryChange: () => {}
	},
	decorators: [
		(Story, context) => {
			const searchbar = useRef<HTMLInputElement>(null);
			const [qcActive, { toggle: toggleQC }] = useBool(false);

			return (
				<HotkeysProvider dialogProps={{ globalGroupName: "zoteroRoam" }}>
					<Story
						{...context}
						quickCopyProps={{ isActive: qcActive, toggle: toggleQC }}
						searchbar={searchbar}
					/>
				</HotkeysProvider>
			);
		}
	],
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
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const WithInteractions: StoryObj<Props> = {
	play: async ({ canvasElement, parameters }) => {
		const {
			userSettings: { copy }
		} = parameters;
		const canvas = within(canvasElement);

		// Hotkey for toggling QuickCopy
		const qcSwitch = canvas.getByRole<HTMLInputElement>("switch");

		await expect(qcSwitch.checked).toBe(copy.useQuickCopy);

		await userEvent.keyboard("{Alt>}Q{/Alt}");

		await waitFor(() => expect(qcSwitch.checked).toBe(!copy.useQuickCopy));

		// Hotkey for focusing the searchbar
		const searchbar = canvas.getByPlaceholderText(
			"Search in abstract, title, authors (last names), year, tags, or citekey"
		);

		await expect(searchbar).not.toHaveFocus();

		await userEvent.keyboard("{Alt>}F{/Alt}");

		await waitFor(() => expect(searchbar).toHaveFocus());
	}
};
