import { useState } from "react";

import { InputDateSingle } from "./InputDate";


export default {
	component: InputDateSingle
};

const Template = (args) => {
	const { value: valueFromArgs, setValue: setFromArgs, ...argList } = args;
	const [value, setValue] = useState(valueFromArgs || undefined);
	return <InputDateSingle value={value} setValue={setValue} {...argList}/>;
};

export const WithDate = Template.bind({});
WithDate.args = {
	value: new Date([2022, 1, 1])
};

export const WithError = Template.bind({});
WithError.args = {
	value: new Date(undefined)
};

export const Empty = Template.bind({});