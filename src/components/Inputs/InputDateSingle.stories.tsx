import { useState } from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import { InputDateSingle } from ".";


export default {
	component: InputDateSingle
} as ComponentMeta<typeof InputDateSingle>;

const Template: ComponentStory<typeof InputDateSingle> = (args) => {
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