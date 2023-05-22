import { useState, ComponentProps } from "react";
import { Meta, StoryFn } from "@storybook/react";

import { InputText } from ".";


type Props = ComponentProps<typeof InputText>;

export default {
	component: InputText
} as Meta<Props>;

const Template: StoryFn<Props & { defaultValue: Props["value"] }> = (args) => {
	const { defaultValue = "", ...argList } = args;
	const [value, setValue] = useState(defaultValue);
	return <InputText {...argList} value={value} setValue={setValue} />;
};

export const Default = Template.bind({});
Default.args = {

};