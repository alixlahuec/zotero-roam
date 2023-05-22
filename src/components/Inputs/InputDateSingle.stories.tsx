import { useState, ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";

import { InputDateSingle } from ".";


type Props = ComponentProps<typeof InputDateSingle>;

export default {
	component: InputDateSingle,
	decorators: [
		(Story, context) => {
			const [value, setValue] = useState(context.args.value || undefined);
			return <Story {...context} args={{ ...context.args, value, setValue }} />;
		}
	]
} as Meta<Props>;

export const WithDate: StoryObj<Props> = {
	args: {
		value: new Date(2022, 0, 1)
	}
};

export const WithError: StoryObj<Props> = {
	args: {
		// @ts-expect-error "Story expects bad input"
		value: new Date(undefined)
	}
};

export const Empty: StoryObj<Props> = {};
