import { ComponentProps } from "react";
import { Menu } from "@blueprintjs/core";
import { Meta, StoryObj } from "@storybook/react";
import { expect, fn, Mock, userEvent, waitFor, within } from "@storybook/test";

import MergeAsOptions from "./MergeAsOptions";
import { apiKeys, libraries } from "Mocks";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary } = libraries;

type Props = ComponentProps<typeof MergeAsOptions>;

export default {
	component: MergeAsOptions,
	args: {
		library: { apikey: masterKey, path: userLibrary.path }
	},
	decorators: [
		(Story, context) => {
			return <Menu>
				<Story {...context} />
			</Menu>;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		options: {
			roam: ["healthcare"],
			zotero: ["HEALTHCARE", "Healthcare", "health care"]
		}
	},
	play: async({ args, canvasElement }) => {
		const into = "healthcare";

		document.dispatchEvent = fn();

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

		await expect((document.dispatchEvent as Mock).mock.calls[0][0].detail)
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
	}
};
