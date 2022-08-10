import { useState } from "react";
import InputComponent from "./InputComponent";

export default {
	component: InputComponent,
	parameters: {
		userSettings: {
			typemap: {
				journalArticle: "Paper",
				podcast: "Podcast"
			}
		}
	}
};

const Template = (args) => {
	const [val, setVal] = useState(args.value);
	return <InputComponent {...args} value={val} setValue={setVal} />;
};

export const Text = Template.bind({});
Text.args = {
	property: "Abstract",
	relationship: "contains",
	value: "systems"
};

export const NoInput = Template.bind({});
NoInput.args = {
	property: "Citekey",
	relationship: "exists",
	value: null
};

export const DateRange = Template.bind({});
DateRange.args = {
	property: "Item added",
	relationship: "between",
	value: [new Date([2022, 1, 1]), null]
};

export const DateSingle = Template.bind({});
DateSingle.args = {
	property: "Item added",
	relationship: "before",
	value: new Date([2022, 1, 1])
};

export const MultiSelect = Template.bind({});
MultiSelect.args = {
	property: "Item type",
	relationship: "is any of",
	value: ["journalArticle", "podcast"]
};

export const Tags = Template.bind({});
Tags.args = {
	property: "Tags",
	relationship: "include",
	value: ["history"]
};