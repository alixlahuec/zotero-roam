import { ComponentProps } from "react";
import { userEvent, waitFor, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { Meta, Story } from "@storybook/react";

import RelatedPanel from ".";
import { cleanRelatedItem } from "../Menus/utils";

import { items } from "Mocks";


type Props = ComponentProps<typeof RelatedPanel>;

export default {
	component: RelatedPanel,
	args: {
		isOpen: true,
		onClose: () => {},
		items: items.slice(0,2).map(it => cleanRelatedItem(it, { pdfs: [], notes: [] }, new Map())),
		show: {
			title: "January 1st, 2022",
			type: "added_on"
		}
	},
	parameters: {
		userSettings: {
			annotations: {},
			metadata: {},
			notes: {},
			typemap: {}
		}
	}
} as Meta<Props>;

const Template: Story<Props> = (args) => <RelatedPanel {...args} />;

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);

	await userEvent.click(canvas.getByRole("button", { name: "Show abstracts" }));

	await waitFor(() => expect(
		canvas.getByRole(
			"button",
			{
				name: "Hide abstracts"
			}
		)
	).toBeInTheDocument());
};