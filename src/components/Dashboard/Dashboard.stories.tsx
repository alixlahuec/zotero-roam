import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, waitFor, within, expect } from "@storybook/test";

import Dashboard from ".";


type Props = ComponentProps<typeof Dashboard>;

export default {
	component: Dashboard,
	args: {
		isOpen: true,
		onClose: () => {}
	},
	parameters: {
		userSettings: {
			annotations: {},
			autocomplete: {},
			copy: {},
			metadata: {},
			notes: {},
			pageMenu: {
				defaults: [],
				trigger: true
			},
			sciteBadge: {},
			shortcuts: {},
			typemap: {}
		}
	}
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	parameters: {
		chromatic: {
			disableSnapshot: true
		}
	}
};

export const VisitTabs: StoryObj<Props> = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole("tab", { name: "Tag Manager" }));

		await waitFor(() => expect(
			canvas.getByRole(
				"tab",
				{
					name: "Suggestions"
				}
			)
		).toBeInTheDocument(),
		{
			timeout: 3000
		});

		await userEvent.click(canvas.getByRole("tab", { name: "Explorer" }));

		await waitFor(() => expect(
			canvas.getByRole(
				"button",
				{
					name: "Set filter"
				}
			)
		).toBeInTheDocument(),
		{
			timeout: 3000
		});

		await userEvent.click(canvas.getByRole("tab", { name: "PDFs" }));

	}
};