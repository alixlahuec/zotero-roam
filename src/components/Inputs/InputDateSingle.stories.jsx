import React, { useState } from "react";
import { InputDateSingle } from "./InputDate";

export default {
	component: InputDateSingle
};

const Template = (args) => {
	const [value, setValue] = useState(args.value || undefined);
	return <InputDateSingle value={value} setValue={setValue} {...args}/>;
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