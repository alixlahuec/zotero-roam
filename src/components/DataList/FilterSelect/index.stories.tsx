import { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "@storybook/test";

import { useFilterList } from "@hooks";

import FilterSelect from ".";


type Props = ComponentProps<typeof FilterSelect>;

export default {
	component: FilterSelect,
	decorators: [
		(Story, context) => {
			const [filterList, toggleFilter] = useFilterList(context.args.options);
			return <Story {...context} args={{ ...context.args, options: filterList, toggleFilter }} />;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {
	args: {
		options: [
			{
				active: false,
				label: "Influential",
				value: "influential"
			},
			{
				active: true,
				label: "In Library",
				value: "inLibrary"
			},
			{
				active: false,
				label: "In Roam",
				value: "inRoam"
			}
		]
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const frame = within(canvasElement.parentElement!);

		const filterBtn = canvas.getByRole("button", { name: "Filter 1" });

		await userEvent.click(filterBtn);

		const filterOption = frame.getByTitle("Influential").parentElement!;

		await expect(filterOption).toHaveAttribute("aria-selected", "false");

		await userEvent.click(filterOption);

		await expect(filterOption).toHaveAttribute("aria-selected", "true");
	}
};
