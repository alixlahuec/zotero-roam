import { useCallback, useState } from "react";
import SortButtons from ".";

export default { 
	component: SortButtons,
	args: {
		name: "item-sort"
	}
};

const Template = (args) => {
	const [selected, setSelected] = useState("published");
	const onSelect = useCallback((val) => setSelected(val), []);

	return <SortButtons onSelect={onSelect} selectedOption={selected} {...args} />;
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
