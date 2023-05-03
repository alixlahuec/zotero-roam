import { useState, ComponentProps } from "react";
import { Meta, Story } from "@storybook/react";

import { InputDateSingle } from ".";


type Props = ComponentProps<typeof InputDateSingle>;

export default {
	component: InputDateSingle
} as Meta<Props>;

const Template: Story<Props> = (args) => {
	const { value: valueFromArgs, setValue: setFromArgs, ...argList } = args;
	const [value, setValue] = useState(valueFromArgs || undefined);
	return <InputDateSingle value={value} setValue={setValue} {...argList}/>;
};

export const WithDate = Template.bind({});
WithDate.args = {
	value: new Date(2022, 0, 1)
};

export const WithError = Template.bind({});
WithError.args = {
	// @ts-expect-error "Story expects bad input"
	value: new Date(undefined)
};

export const Empty = Template.bind({});