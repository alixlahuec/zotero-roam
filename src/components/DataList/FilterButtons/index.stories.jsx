import { userEvent, within } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import useFilterList from "../../../../src/hooks/useFilterList";
import FilterButtons from "Components/DataList/FilterButtons";


export default {
	component: FilterButtons
};

const Template = (args) => {
	const [filterList, toggleFilter] = useFilterList(args.options);

	return <FilterButtons options={filterList} toggleFilter={toggleFilter} />;
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

	const filterBtn = canvas.getByRole("button", { name: "Influential" });

	await expect(filterBtn).not.toHaveClass("bp3-active");

	await userEvent.click(filterBtn);

	await expect(filterBtn).toHaveClass("bp3-active");
};