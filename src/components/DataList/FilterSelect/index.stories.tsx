import { ComponentProps } from "react";

import { userEvent, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { Meta, Story } from "@storybook/react";

import { useFilterList } from "../../../hooks";
import FilterSelect from ".";


type Props = ComponentProps<typeof FilterSelect>;

export default {
	component: FilterSelect
} as Meta<Props>;

const Template: Story<Props> = (args) => {
	const [filterList, toggleFilter] = useFilterList(args.options);

	return <FilterSelect options={filterList} toggleFilter={toggleFilter} />;
};

export const Default = Template.bind({});
Default.args = {
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
};
Default.play = async({ canvasElement }) => {
	const canvas = within(canvasElement);
	const frame = within(canvasElement.parentElement!);

	const filterBtn = canvas.getByRole("button", { name: "Filter 1" });

	await userEvent.click(filterBtn);

	const filterOption = frame.getByTitle("Influential").parentElement!;

	await expect(filterOption).toHaveAttribute("aria-selected", "false");

	await userEvent.click(filterOption);

	await expect(filterOption).toHaveAttribute("aria-selected", "true");
};