import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { expect, fn, Mock, userEvent, waitFor, within } from "@storybook/test";

import WebImportPanel from "./WebImportPanel";
import { badIdentifier, citoids, goodIdentifier, libraries } from "Mocks";


const { userLibrary } = libraries;

type Props = ComponentProps<typeof WebImportPanel>;

export default {
	component: WebImportPanel,
	args: {
		isOpen: true,
		onClose: () => {}
	},
	parameters: {
		userSettings: {
			typemap: {}
		}
	}
} as Meta<Props>;

export const WithValidLink: StoryObj<Props> = {
	args: {
		urls: [goodIdentifier]
	}
};

export const WithInvalidLink: StoryObj<Props> = {
	args: {
		urls: [badIdentifier]
	}
};

export const WithMixedLinks: StoryObj<Props> = {
	args: {
		urls: [badIdentifier, goodIdentifier]
	}
};

export const WithInteractions: StoryObj<Props> = {
	args: {
		urls: [goodIdentifier]
	},
	play: async ({ args, canvasElement }) => {
		const items = args.urls.map((id) => citoids[id]);

		document.dispatchEvent = fn();

		const canvas = within(canvasElement);

		await waitFor(() => expect(canvas.getByRole("listitem", { name: args.urls[0] }))
			.toBeInTheDocument(),
		{ timeout: 3000 });

		const firstCitoid = await canvas.findByRole("listitem", {
			name: args.urls[0],
			queryFallbacks: true
		});
		const citoidCheckbox = within(firstCitoid).getByRole<HTMLInputElement>("checkbox").nextElementSibling!;

		await userEvent.click(citoidCheckbox);

		await waitFor(() => expect(canvas.getByRole("button", { name: "Send to Zotero" }))
			.toBeInTheDocument(),
		{ timeout: 3000 });

		const importButton = await canvas.findByRole("button", { name: "Send to Zotero" });

		await userEvent.click(importButton);

		await waitFor(() => expect(document.dispatchEvent)
			.toHaveBeenCalled(),
		{ timeout: 3000 });

		await expect((document.dispatchEvent as Mock).mock.calls[0][0].detail)
			.toEqual({
				args: {
					collections: [],
					items,
					tags: []
				},
				data: {
					successful: [
						{
							failed: {},
							success: {
								0: expect.stringContaining("")
							},
							successful: {
								0: expect.objectContaining({
									data: expect.objectContaining(items[0])
								})
							},
							unchanged: {}
						}
					],
					failed: []
				},
				error: null,
				library: userLibrary.path,
				_type: "write"
			});
	}
};
