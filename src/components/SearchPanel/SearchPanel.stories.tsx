import { ComponentProps } from "react";
import { expect } from "@storybook/jest";
import { Meta, StoryFn } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";

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

const Template: StoryFn<Props> = (args) => <SearchPanel {...args} />;

export const Default = Template.bind({});

export const WithRoamCitekey = Template.bind({});
WithRoamCitekey.parameters = {
	roamCitekeys: [
		["@" + items[0].key, "_some_uid_"]
	]
};

export const WithLookup = Template.bind({});
WithLookup.play = async ({ canvasElement }) => {
	const canvas = within(canvasElement);

	await userEvent.type(canvas.getByPlaceholderText("Search in abstract, title, authors (last names), year, tags, or citekey"), items[0].key);

	await waitFor(() => expect(
		canvas.getAllByRole(
			"menuitem"
		).length
	)
		.toBe(1));

	const resultItem = canvas.getByRole("menuitem");

	await userEvent.click(resultItem);

	await waitFor(() => expect(
		canvas.getByText(items[0].data.title)
	)
		.toBeInTheDocument());

};