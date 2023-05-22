import { ComponentProps, useCallback, useState } from "react";
import { Meta, StoryFn } from "@storybook/react";
import SortButtons from ".";


type Props = ComponentProps<typeof SortButtons>;

export default { 
	component: SortButtons,
	args: {
		name: "item-sort"
	}
} as Meta<Props>;

const Template: StoryFn<Props> = (args) => {
	const [selected, setSelected] = useState("published");
	const onSelect = useCallback((val) => setSelected(val), []);

	return <SortButtons {...args} onSelect={onSelect} selectedOption={selected} />;
};

export const WithIcons = Template.bind({});
WithIcons.args = {
	options: [
		{ icon: "eye-open", label: "Visibility", value: "visibility" },
		{ icon: "history", label: "Publication Year", value: "published" },
		{ icon: "cloud", label: "Location", value: "location" }
	]
};

export const WithoutIcons = Template.bind({});
WithoutIcons.args = {
	options: [
		{ label: "Alphabetical (A-Z)", value: "alphabetical" },
		{ label: "Publication Year", value: "published" },
		{ label: "Priority", value: "priority" }
	]
};
