import { ComponentProps } from "react";
import { expect } from "@storybook/jest";
import { userEvent, within } from "@storybook/testing-library";
import { Meta, Story } from "@storybook/react";

import Logger from ".";
import ZoteroRoam, { ZoteroRoamLog } from "../../extension";


type Props = ComponentProps<typeof Logger>;

export default {
	component: Logger,
	args: {
		isOpen: true,
		onClose: () => {}
	}
} as Meta<Props>;

const Template: Story<Props> = (args) => {
	window.zoteroRoam = {
		logs: [
			new ZoteroRoamLog({
				origin: "API",
				message: "Failed to fetch",
				detail: "404 Error - Not Found",
				context: {
					dataURI: "users/123456/items",
					error: "Some error message"
				}
			}, "error"),
			new ZoteroRoamLog({
				origin: "Shortcuts",
				message: "Hotkey combo is not valid",
				context: {
					combo: "alt++"
				}
			}, "warning"),
			new ZoteroRoamLog({
				origin: "Setup",
				message: "Extension initialized from roam/js",
				context: {}
			}, "info")
		],
	} as ZoteroRoam;

	return <Logger {...args} />;
};

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);

	await expect(canvas.queryByText("warning"))
		.not
		.toBeInTheDocument();

	const showAllToggle = canvas.getByRole("switch", { name: "Show all entries" }) as HTMLInputElement;

	await expect(showAllToggle.checked)
		.toBe(false);

	await userEvent.click(showAllToggle);

	await expect(showAllToggle.checked)
		.toBe(true);

	await expect(canvas.queryByText("warning"))
		.toBeInTheDocument();
};