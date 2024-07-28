import { ComponentProps, useRef } from "react";
import { HotkeysProvider } from "@blueprintjs/core";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, waitFor, within, expect } from "@storybook/test";

import { useBool } from "@hooks";

import SearchInputGroup from ".";


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
					<Story {...context}
						args={{
							...context.args,
							quickCopyProps: { isActive: qcActive, toggle: toggleQC },
							searchbar
						}}
					/>
				</HotkeysProvider>
			);
		}
	],
	parameters: {
		userSettings: {
			copy: {
				useQuickCopy: false
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

		// Toggling QuickCopy
		const qcSwitch = canvas.getByRole<HTMLInputElement>("switch");
		await expect(qcSwitch.checked).toBe(copy.useQuickCopy);

		await userEvent.click(qcSwitch);
		await waitFor(() => expect(qcSwitch.checked).toBe(!copy.useQuickCopy));

		// Searchbar focus
		const searchbar = canvas.getByPlaceholderText(
			"Search in abstract, title, authors (last names), year, tags, or citekey"
		);

		await expect(searchbar).not.toHaveFocus();

		// can't be tested anymore with RTL 14 (dropped support for Blueprint internals):
		// await userEvent.keyboard("{Alt>}f{/Alt}");
		// await waitFor(() => expect(searchbar).toHaveFocus());
	}
};
