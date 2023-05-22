import { useState, ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";

import { InputDateRange } from ".";


type Props = ComponentProps<typeof InputDateRange>;

export default {
	component: InputDateRange,
	decorators: [
		(Story, context) => {
			const { args } = context;
			const [value, setValue] = useState(args.value || [null, null]);
			return <Story {...context} value={value} setValue={setValue} />;
		}
	]
} as Meta<Props>;

export const StartDateOnly: StoryObj<Props> = {
	args: {
		value: [new Date(2022, 0, 1), null]
	}
};

export const EndDateOnly: StoryObj<Props> = {
	args: {
		value: [null, new Date(2022, 3, 1)]
	}
};

export const StartAndEndDates: StoryObj<Props> = {
	args: {
		value: [new Date(2022, 0, 1), new Date(2022, 3, 1)]
	}
};

export const Empty: StoryObj<Props> = {};
