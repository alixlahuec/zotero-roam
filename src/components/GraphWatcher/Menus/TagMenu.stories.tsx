import { ComponentProps } from "react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { Meta, StoryObj } from "@storybook/react";


import TagMenu from "./TagMenu";

import { cleanRelatedItem } from "../helpers";
import { items } from "Mocks";


type Props = ComponentProps<typeof TagMenu>;


export default {
	component: TagMenu,
	args: {
		inAbstract: [cleanRelatedItem(items[0], { pdfs: [], notes: [] }, new Map())],
		tag: "systems",
		tagged: [cleanRelatedItem(items[1], { pdfs: [], notes: [] }, new Map())]
	}
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);
		const frame = within(canvasElement.parentElement!);

		const taggedButton = canvas.getByRole("button", { name: "1 tagged item" });
		const inAbstractButton = canvas.getByRole("button", { name: "1 abstract" });

		// "Tagged with"
		await userEvent.click(taggedButton);

		await waitFor(() =>
			expect(frame.getByRole("dialog")).toBeInTheDocument()
		);

		const taggedDialog = frame.getByRole("dialog");
		await waitFor(() => expect(within(taggedDialog).getByText(`1 item tagged with ${args.tag}`))
			.toBeInTheDocument()
		);
		await userEvent.click(within(taggedDialog).getByRole("button", { name: "Close dialog" }));

		// "Abstract contains"
		await userEvent.click(inAbstractButton);

		await waitFor(() =>
			expect(frame.getByRole("dialog")).toBeInTheDocument()
		);

		const inAbstractDialog = frame.getByRole("dialog");
		await waitFor(() => expect(within(inAbstractDialog).getByText(`1 abstract containing ${args.tag}`))
			.toBeInTheDocument()
		);

	}
};