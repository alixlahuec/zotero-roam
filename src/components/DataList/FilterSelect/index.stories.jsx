import { userEvent, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import useFilterList from "../../../hooks/useFilterList";
import FilterSelect from "Components/DataList/FilterSelect";


export default {
	component: FilterSelect
};

const Template = (args) => {
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
	const frame = within(canvasElement.parentElement);

	const filterBtn = canvas.getByRole("button", { name: "Filter" });

	await userEvent.click(filterBtn);

	const filterOption = frame.getByTitle("Influential").parentElement;

	await expect(filterOption).toHaveAttribute("aria-selected", "false");

	await userEvent.click(filterOption);

	await expect(filterOption).toHaveAttribute("aria-selected", "true");
};