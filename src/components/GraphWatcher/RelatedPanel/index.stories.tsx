import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, waitFor, within, expect } from "@storybook/test";

import RelatedPanel from ".";
import { cleanRelatedItem } from "../helpers";

import { items } from "Mocks";


type Props = ComponentProps<typeof RelatedPanel>;

export default {
	component: RelatedPanel,
	args: {
		isOpen: true,
		onClose: () => {},
		items: items.slice(0, 2).map((it) => cleanRelatedItem(it, { pdfs: [], notes: [] }, new Map())),
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

export const Default: StoryObj<Props> = {};

export const WithInteractions: StoryObj<Props> = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.click(canvas.getByRole("button", { name: "Show abstracts" }));

		await waitFor(() => expect(canvas.getByRole("button", { name: "Hide abstracts" }))
			.toBeInTheDocument()
		);
	}
};
