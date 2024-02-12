import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";

import InlineCitekeys, { WATCHER_DELAY } from ".";
import { CitekeyReferenceValid, CitekeyReferenceInvalid } from "../fixtures";


type Props = ComponentProps<typeof InlineCitekeys>;

export default {
	component: InlineCitekeys,
	decorators: [
		(Story, context) => {
			const { parameters: { Component } } = context;

			return <>
				<Component />
				<Story {...context} />
			</>;
		}
	]
} as Meta<Props>;

export const WithCitekeyInLibrary: StoryObj<Props> = {
	parameters: {
		Component: CitekeyReferenceValid
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const frame = within(canvasElement.parentElement!);

		const referenceSpan = canvas.getByTestId("reference-wrapper");
		const referenceLinkSpan = within(referenceSpan).getByTestId("reference-link");

		await waitFor(() =>
			expect(referenceSpan).toHaveAttribute("data-in-library", "true"),
		{ timeout: WATCHER_DELAY * 3 });
		
		await userEvent.pointer({ keys: "[MouseRight]", target: referenceLinkSpan });

		await waitFor(() =>
			expect(frame.getByText("Import metadata"))
				.toBeInTheDocument()
		);
	}
};

export const WithCitekeyNotInLibrary: StoryObj<Props> = {
	parameters: {
		Component: CitekeyReferenceInvalid
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const frame = within(canvasElement.parentElement!);

		const referenceSpan = canvas.getByTestId("reference-wrapper");
		const referenceLinkSpan = within(referenceSpan).getByTestId("reference-link");

		await waitFor(() =>
			expect(referenceSpan).toHaveAttribute("data-in-library", "false"),
		{ timeout: WATCHER_DELAY * 2 });

		await userEvent.pointer({ keys: "[MouseRight]", target: referenceLinkSpan });

		await waitFor(() =>
			expect(frame.queryByText("Import metadata"))
				.not.toBeInTheDocument()
		);
	}
};