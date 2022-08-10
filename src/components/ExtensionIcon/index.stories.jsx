import ExtensionIcon from ".";

import { screen, userEvent, waitFor, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";

import { sleep } from "../../../.storybook/utils";
import useToggle from "../../hooks/useToggle";


export default {
	component: ExtensionIcon,
	args: {
		openDashboard: () => {},
		openSearchPanel: () => {},
		openSettingsPanel: () => {}
	},
	argTypes: {
		openDashboard: { action: true },
		openSearchPanel: { action: true },
		openSettingsPanel: { action: true }
	},
	parameters: {
		userSettings: {
			darkTheme: false
		}
	}
};

const Template = (args) => {
	const [status, toggleStatus] = useToggle({
		start: "on",
		options: ["on", "off"]
	});
	return <ExtensionIcon {...args} status={status} toggleExtension={toggleStatus} />;
};

const DisabledTemplate = (args) => {
	return <ExtensionIcon {...args} status="disabled" />;
};

export const Disabled = DisabledTemplate.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);
	const icon = canvas.getByRole("button", { name: "Click to toggle the zoteroRoam extension" });

	await sleep(2000);

	await userEvent.hover(icon);

	await waitFor(() => expect(canvas.getByText("Changelog"))
		.toBeInTheDocument());
    
	await sleep(1000);

	await userEvent.click(icon, { button: 2 });

	await waitFor(() => expect(screen.getByText("Dashboard"))
		.toBeInTheDocument(),
	{
		timeout: 2000
	});
};