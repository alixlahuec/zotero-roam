import { ComponentProps } from "react";
import { Menu } from "@blueprintjs/core";
import { expect, jest } from "@storybook/jest";
import { Meta, Story } from "@storybook/react";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import MergeAsOptions from "./MergeAsOptions";
import { apiKeys, libraries } from "Mocks";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary } = libraries;

type Props = ComponentProps<typeof MergeAsOptions>;

export default {
	component: MergeAsOptions,
	args: {
		library: { apikey: masterKey, path: userLibrary.path }
	}
} as Meta<Props>;

const Template: Story<Props> = (args) => <Menu><MergeAsOptions {...args} /></Menu>;

export const Default = Template.bind({});
Default.args = {
	options: {
		roam: ["healthcare"],
		zotero: ["HEALTHCARE", "Healthcare", "health care"]
	}
};
Default.play = async({ args, canvasElement }) => {
	const into = "healthcare";

	document.dispatchEvent = jest.fn();

	const canvas = within(canvasElement);
	const frame = within(canvasElement.parentElement!);

	await userEvent.click(canvas.getByTitle("Choose custom value..."));

	const inputBar = frame.getByPlaceholderText("Enter a value");

	await expect(inputBar).toHaveFocus();

	await userEvent.type(inputBar, into);

	await userEvent.click(frame.getByRole("button", { name: "OK" }));

	await waitFor(() => expect(
		document.dispatchEvent
	).toHaveBeenCalled(), 
	{ 
		timeout: 3000 
	});

	await expect((document.dispatchEvent as jest.Mock).mock.calls[0][0].detail)
		.toEqual({
			args: {
				into,
				tags: [...args.options.roam, ...args.options.zotero]
			},
			data: {
				successful: [],
				failed: []
			},
			error: null,
			library: userLibrary.path,
			_type: "tags-modified"
		});
};