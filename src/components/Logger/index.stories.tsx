import { ComponentProps } from "react";
import { expect, userEvent, within } from "@storybook/test";

import { Meta, StoryObj } from "@storybook/react";

import Logger from ".";
import ZoteroRoam from "../../api";
import { ZoteroRoamLog } from "../../api/logging";


type Props = ComponentProps<typeof Logger>;

export default {
	component: Logger,
	args: {
		isOpen: true,
		onClose: () => {}
	},
	decorators: [
		(Story, context) => {
			window.zoteroRoam = {
				logs: [
					new ZoteroRoamLog(
						{
							origin: "API",
							message: "Failed to fetch",
							detail: "404 Error - Not Found",
							context: {
								dataURI: "users/123456/items",
								error: "Some error message"
							}
						},
						"error"
					),
					new ZoteroRoamLog(
						{
							origin: "Shortcuts",
							message: "Hotkey combo is not valid",
							context: {
								combo: "alt++"
							}
						},
						"warning"
					),
					new ZoteroRoamLog(
						{
							origin: "Setup",
							message: "Extension initialized from roam/js",
							context: {}
						},
						"info"
					)
				]
			} as ZoteroRoam;
			
			return <Story {...context} />;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const WithInteractions: StoryObj<Props> = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await expect(canvas.queryByText("warning")).not.toBeInTheDocument();

		const showAllToggle = canvas.getByRole<HTMLInputElement>("switch", {
			name: "Show all entries"
		});

		await expect(showAllToggle.checked).toBe(false);

		await userEvent.click(showAllToggle);

		await expect(showAllToggle.checked).toBe(true);

		await expect(canvas.queryByText("warning")).toBeInTheDocument();
	}
};
