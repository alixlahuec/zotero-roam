import { useState, ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";

import { InputMultiSelect } from ".";


type Props = ComponentProps<typeof InputMultiSelect>;

export default {
	component: InputMultiSelect,
	args: {
		options: [
			{ label: "history", value: "history" },
			{ label: "culture", value: "culture" },
			{ label: "TODO", value: "TODO" }
		]
	},
	decorators: [
		(Story, context) => {
			const { args } = context;
			const [selected, setSelected] = useState(args.value || []);
			return <Story {...context} value={selected} setValue={setSelected} />;
		}
	]
} as Meta<Props>;

export const Default: StoryObj<Props> = {};

export const WithSelection: StoryObj<Props> = {
	args: {
		value: ["history", "TODO"]
	}
};
