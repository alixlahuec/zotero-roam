import { ComponentProps, useCallback, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import SortButtons from ".";


type Props = ComponentProps<typeof SortButtons>;

export default {
	component: SortButtons,
	args: {
		name: "item-sort"
	},
	decorators: [
		(Story, context) => {
			const [selectedOption, setSelected] = useState("published");
			const onSelect = useCallback((val) => setSelected(val), []);

			return <Story {...context} args={{ ...context.args, onSelect, selectedOption }} />;
		}
	]
} as Meta<Props>;

export const WithIcons: StoryObj<Props> = {
	args: {
		options: [
			{ icon: "eye-open", label: "Visibility", value: "visibility" },
			{ icon: "history", label: "Publication Year", value: "published" },
			{ icon: "cloud", label: "Location", value: "location" }
		]
	}
};

export const WithoutIcons: StoryObj<Props> = {
	args: {
		options: [
			{ label: "Alphabetical (A-Z)", value: "alphabetical" },
			{ label: "Publication Year", value: "published" },
			{ label: "Priority", value: "priority" }
		]
	}
};
