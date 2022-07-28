import React from "react";
import RelatedPanel from ".";

import { expect } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import { items } from "Mocks/zotero/items";
import { cleanRelatedItem } from "../Menus/utils";

export default {
	component: RelatedPanel,
	args: {
		isOpen: true,
		onClose: () => {},
		items: items.slice(0,2).map(it => cleanRelatedItem(it, { pdfs: [], notes: [] }, new Map())),
		show: {
			title: "January 1st, 2022",
			type: "added_on"
		},
		userSettings: {
			annotations: {},
			metadata: {},
			notes: {},
			typemap: {}
		}
	}
};

const Template = (args) => <RelatedPanel {...args} />;

export const Default = Template.bind({});

export const WithInteractions = Template.bind({});
WithInteractions.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);

	await userEvent.click(canvas.getByRole("button", { name: "Show abstracts"}));

	await waitFor(() => expect(
		canvas.getByRole(
			"button",
			{
				name: "Hide abstracts"
			}
		)
	).toBeInTheDocument());
};