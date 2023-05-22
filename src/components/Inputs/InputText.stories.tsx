import { useState, ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";

import { InputText } from ".";


type Props = ComponentProps<typeof InputText>;

export default {
	component: InputText,
	decorators: [
		(Story, context) => {
			const { args } = context;
			const [value, setValue] = useState(args.value || "");
			return <Story {...context} value={value} setValue={setValue} />;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {};
