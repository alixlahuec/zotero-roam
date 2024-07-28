import { ComponentProps } from "react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { Meta, StoryObj } from "@storybook/react";


import DNPMenu from "./DNPMenu";
import { cleanRelatedItem } from "../helpers";

import { items } from "Mocks";


type Props = ComponentProps<typeof DNPMenu>;

export default {
	component: DNPMenu,
	args: {
		added: [cleanRelatedItem(items[0], { pdfs: [], notes: [] }, new Map())],
		title: "January 1st, 2022"
	}
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const frame = within(canvasElement.parentElement!);

		await userEvent.click(canvas.getByRole("button", { name: "1 item added" }));

		await waitFor(() =>
			expect(frame.getByRole("dialog")).toBeInTheDocument()
		);

		const relatedDialog = frame.getByRole("dialog");

		await waitFor(() => expect(within(relatedDialog).getByText(`1 item added on ${args.title}`))
			.toBeInTheDocument()
		);

	}
};