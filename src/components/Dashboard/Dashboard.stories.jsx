import { userEvent, waitFor, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";

import Dashboard from ".";


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
};

const Template = (args) => <Dashboard {...args} />;

export const Default = Template.bind({});

export const VisitTabs = Template.bind({});
VisitTabs.play = async ({ canvasElement }) => {
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

};