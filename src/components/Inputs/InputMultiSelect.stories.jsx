import { useState } from "react";
import InputMultiSelect from "./InputMultiSelect";

export default {
	component: InputMultiSelect,
	args: {
		options: [
			{ label: "history", value: "history" }, 
			{ label: "culture", value: "culture" }, 
			{ label: "TODO", value: "TODO" }
		]
	}
};

const Template = (args) => {
	const { value: valueFromArgs, setValue: setFromArgs, ...argList } = args;
	const [selected, setSelected] = useState(valueFromArgs || []);
	return <InputMultiSelect value={selected} setValue={setSelected} {...argList} />;
};

export const Default = Template.bind({});

export const WithSelection = Template.bind({});
WithSelection.args = {
	value: ["history", "TODO"]
};