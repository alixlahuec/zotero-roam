import { ComponentProps } from "react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { Meta, StoryObj } from "@storybook/react";


import SearchPanel from ".";
import { items } from "Mocks";
import { ExtensionStatusEnum } from "Types/extension";


type Props = ComponentProps<typeof SearchPanel>;

export default {
	component: SearchPanel,
	args: {
		isOpen: true,
		onClose: () => {},
		status: ExtensionStatusEnum.ON
	},
	parameters: {
		userSettings: {
			copy: {
				always: true,
				defaultFormat: "citekey",
				overrideKey: "shiftKey",
				useQuickCopy: false
			},
			shortcuts: {
				copyDefault: "",
				importMetadata: ""
			}
		}
	}
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const WithRoamCitekey: StoryObj<Props> = {
	parameters: {
		roamCitekeys: [["@" + items[0].key, "_some_uid_"]]
	}
};

export const WithLookup: StoryObj<Props> = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.type(
			canvas.getByPlaceholderText(
				"Search in abstract, title, authors (last names), year, tags, or citekey"
			),
			items[0].key
		);

		await waitFor(() => expect(canvas.getAllByRole("menuitem").length).toBe(1));

		const resultItem = canvas.getByRole("menuitem");

		await userEvent.click(resultItem);

		await waitFor(() => expect(canvas.getByText(items[0].data.title)).toBeInTheDocument());
	}
};
