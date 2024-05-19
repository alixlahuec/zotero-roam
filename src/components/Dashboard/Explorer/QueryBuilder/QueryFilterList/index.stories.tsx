import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";

import { useArrayReducer } from "@hooks";

import QueryFilterList from ".";
import { QueryTermListRecursive } from "../types";


type Props = ComponentProps<typeof QueryFilterList>;

export default {
	component: QueryFilterList,
	args: {
		useOR: false
	},
	decorators: [
		(Story, context) => {
			const [terms, dispatch] = useArrayReducer<QueryTermListRecursive[]>(context.args.terms);
			return <Story {...context} args={{ ...context.args, dispatch, terms }} />;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		terms: [
			[
				[{ property: "Citekey", relationship: "exists", value: null }],
				[{ property: "Item added", relationship: "before", value: new Date(2022, 3, 1) }]
			],
			[
				[{ property: "Abstract", relationship: "contains", value: "history" }],
				[{ property: "Title", relationship: "contains", value: "history" }]
			]
		]
	}
};

export const WithInteractions: StoryObj<Props> = {
	...Default,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const frame = within(canvasElement.parentElement!);

		// Remove a term
		const removeTermButton = canvas.getByText("Item added before April 1st, 2022").nextElementSibling!;
		await userEvent.click(removeTermButton);

		// Click on a term to open a query box
		const filterTerm = canvas.getByText("Abstract contains history");
		await userEvent.click(filterTerm);
		const termDialog = frame.getByRole("dialog");
		// Add a sibling term
		const addSibling = within(termDialog).getByRole("button", { name: "AND" });
		await userEvent.click(addSibling);
		// Remove the first term
		const removeFirstTerm = within(termDialog).getAllByRole("button", { name: "Remove query term" })[0];
		await userEvent.click(removeFirstTerm);
	}
};
