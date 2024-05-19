import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { screen, userEvent, waitFor, within, expect } from "@storybook/test";

import { useToggle } from "@hooks";

import ExtensionIcon from ".";

import { sleep } from "../../../.storybook/utils";
import { ExtensionStatusEnum } from "Types/extension";


type Props = ComponentProps<typeof ExtensionIcon>;

export default {
	component: ExtensionIcon,
	args: {
		openDashboard: () => {},
		openLogger: () => {},
		openSearchPanel: () => {},
		openSettingsPanel: () => {}
	},
	argTypes: {
		openDashboard: { action: true },
		openLogger: { action: true },
		openSearchPanel: { action: true },
		openSettingsPanel: { action: true }
	},
	parameters: {
		userSettings: {
			darkTheme: false
		}
	}
} as Meta<Props>;

export const Disabled: StoryObj<Props> = {
	render: (args) => <ExtensionIcon {...args} status={ExtensionStatusEnum.DISABLED} />
};

export const WithInteractions: StoryObj<Props> = {
	decorators: [
		(Story, context) => {
			const [status, toggleExtension] = useToggle<Props["status"]>({
				start: ExtensionStatusEnum.ON,
				options: [ExtensionStatusEnum.ON, ExtensionStatusEnum.OFF]
			});
			return <Story {...context} args={{ ...context.args, status, toggleExtension }} />;
		}
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const icon = canvas.getByRole("button", { name: "Click to toggle the zoteroRoam extension" });

		await sleep(2000);

		await userEvent.hover(icon);

		await waitFor(() => expect(canvas.getByText("Docs"))
			.toBeInTheDocument());

		await sleep(1000);

		await userEvent.pointer({ keys: "[MouseRight]", target: icon });

		await waitFor(() => expect(screen.getByText("Dashboard"))
			.toBeInTheDocument(),
		{ timeout: 2000 });
	}
};
