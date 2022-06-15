import React, { useState } from "react";
import { InputDateRange } from "./InputDate";

export default {
	component: InputDateRange,
};

const Template = (args) => {
	const [value, setValue] = useState(args.value || [null, null]);
	return <InputDateRange value={value} setValue={setValue} {...args}/>;
};

export const StartDateOnly = Template.bind({});
StartDateOnly.args = {
	value: [new Date([2022, 1, 1]), null]
};

export const EndDateOnly = Template.bind({});
EndDateOnly.args = {
	value: [null, new Date([2022, 4, 1])]
};

export const StartAndEndDates = Template.bind({});
StartAndEndDates.args = {
	value: [new Date([2022, 1, 1]), new Date([2022, 4, 1])]
};

export const Empty = Template.bind({});