import { useState, ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";

import { InputText } from ".";


type Props = ComponentProps<typeof InputText>;

export default {
	component: InputText,
	decorators: [
		(Story, context) => {
			const [value, setValue] = useState(context.args.value || "");
			return <Story {...context} args={{ ...context.args, value, setValue }} />;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {};
