import React from "react";
import SortButtons from ".";

export default { 
	component: SortButtons,
	args: {
		name: "item-sort",
		onSelect: () => {}
	}
};

const Template = (args) => <SortButtons {...args} />;

export const WithIcons = Template.bind({});
WithIcons.args = {
	options: [
		{icon: "eye-open", label: "Visibility", value: "visibility"},
		{icon: "history", label: "Recency", value: "recency"},
		{icon: "cloud", label: "Location", value: "location"}
	],
	selectedOption: "visibility"
};

export const WithoutIcons = Template.bind({});
WithoutIcons.args = {
	options: [
		{label: "Alphabetical (A-Z)", value: "alphabetical"},
		{label: "Publication Year", value: "published"},
		{label: "Priority", value: "priority"}
	],
	selectedOption: "priority"
};
