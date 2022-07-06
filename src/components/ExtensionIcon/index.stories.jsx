import React from "react";
import ExtensionIcon from ".";

import { expect } from "@storybook/jest";
import { screen, userEvent, waitFor, within } from "@storybook/testing-library";
import useToggle from "../../hooks/useToggle";

export default {
	component: ExtensionIcon,
	args: {
		openDashboard: () => {},
		openSearchPanel: () => {},
		userSettings: {
			darkTheme: false
		}
	},
	argTypes: {
		openDashboard: { action: true },
		openSearchPanel: { action: true }
	},
};

const Template = (args) => {
	const [status, toggleStatus] = useToggle({
		start: "on",
		options: ["on", "off"]
	});
	return <ExtensionIcon {...args} status={status} toggleExtension={toggleStatus} />;
};

export const Default = Template.bind({});
Default.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);
	const icon = canvas.getByRole("button", { name: "Toggle the zoteroRoam extension" });

	await userEvent.hover(icon);

	await waitFor(() => expect(canvas.getByText("Changelog"))
		.toBeInTheDocument());

	await userEvent.click(icon, {button: 2});

	await waitFor(() => expect(screen.getByText("Dashboard"))
		.toBeInTheDocument(),
	{
		timeout: 2000
	});
};