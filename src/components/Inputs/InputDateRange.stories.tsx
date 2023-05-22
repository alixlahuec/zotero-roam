import { useState, ComponentProps } from "react";
import { Meta, StoryFn } from "@storybook/react";

import { InputDateRange } from ".";


type Props = ComponentProps<typeof InputDateRange>;

export default {
	component: InputDateRange,
} as Meta<Props>;

const Template: StoryFn<Props> = (args) => {
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