import { useState } from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import { InputDateRange } from ".";


export default {
	component: InputDateRange,
} as ComponentMeta<typeof InputDateRange>;

const Template: ComponentStory<typeof InputDateRange> = (args) => {
	const { value: valueFromArgs, setValue: setFromArgs, ...argList } = args;
	const [value, setValue] = useState(valueFromArgs || [null, null]);
	return <InputDateRange value={value} setValue={setValue} {...argList}/>;
};

export const StartDateOnly = Template.bind({});
StartDateOnly.args = {
	value: [new Date(2022, 0, 1), null]
};

export const EndDateOnly = Template.bind({});
EndDateOnly.args = {
	value: [null, new Date(2022, 3, 1)]
};

export const StartAndEndDates = Template.bind({});
StartAndEndDates.args = {
	value: [new Date(2022, 0, 1), new Date(2022, 3, 1)]
};

export const Empty = Template.bind({});